// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import { MongoDBAdapter } from '@auth/mongodb-adapter'
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongoose';
import { User } from '@/models/user';
import { Subscription } from '@/types/next-auth';
import { sendWelcomeEmail } from '@/lib/email';

// MongoDB client for NextAuth adapter
const client = new MongoClient(process.env.MONGODB_URI!);
const clientPromise = client.connect();

export const authOptions: NextAuthOptions = {
    adapter: MongoDBAdapter(clientPromise),
    providers: [
        // Email/Password Provider
        CredentialsProvider({
            id: 'credentials',
            name: 'Email and Password',
            credentials: {
                email: {
                    label: 'Email',
                    type: 'email',
                    placeholder: 'your@email.com'
                },
                password: {
                    label: 'Password',
                    type: 'password',
                    placeholder: 'Your password'
                }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Email and password are required');
                }

                try {
                    await connectDB();

                    // Find user by email
                    const user = await User.findOne({
                        email: credentials.email.toLowerCase()
                    });

                    if (!user) {
                        throw new Error('No user found with this email');
                    }

                    // Check if email is verified
                    if (!user.emailVerified) {
                        throw new Error('Please verify your email before signing in');
                    }

                    // Check if account is locked
                    if (user.security?.lockedUntil && user.security.lockedUntil > new Date()) {
                        throw new Error('Account is temporarily locked. Please try again later.');
                    }

                    // Verify password
                    const isPasswordValid = await bcrypt.compare(
                        credentials.password,
                        user.password
                    );

                    if (!isPasswordValid) {
                        // Increment login attempts
                        await User.findByIdAndUpdate(user._id, {
                            $inc: { 'security.loginAttempts': 1 },
                            $set: {
                                'security.lockedUntil': user.security?.loginAttempts >= 4
                                    ? new Date(Date.now() + 15 * 60 * 1000) // Lock for 15 minutes
                                    : undefined
                            }
                        });

                        throw new Error('Invalid password');
                    }

                    // Reset login attempts on successful login
                    await User.findByIdAndUpdate(user._id, {
                        $unset: {
                            'security.loginAttempts': 1,
                            'security.lockedUntil': 1
                        },
                        $set: {
                            'security.lastLogin': new Date(),
                            'lastActiveAt': new Date()
                        }
                    });

                    return {
                        id: user._id.toString(),
                        email: user.email,
                        name: user.name,
                        image: user.avatar,
                        role: user.role,
                        emailVerified: user.emailVerified,
                        subscription: user.subscription
                    };
                } catch (error) {
                    console.error('Authentication error:', error);
                    throw error;
                }
            }
        }),

        // Google OAuth Provider
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code"
                }
            }
        }),

        // GitHub OAuth Provider
        GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!
        }),

        // You can add more providers here
        // FacebookProvider, TwitterProvider, LinkedInProvider, etc.
    ],

    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        updateAge: 24 * 60 * 60, // 24 hours
    },

    jwt: {
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },

    pages: {
        signIn: '/auth/signin',
        // signUp: '/auth/signup',
        error: '/auth/error',
        verifyRequest: '/auth/verify-request',
        newUser: '/auth/welcome'
    },

    callbacks: {
        async signIn({ user, account, profile, email, credentials }) {
            try {
                await connectDB();

                // Handle OAuth sign-ins
                if (account?.provider !== 'credentials') {
                    let existingUser = await User.findOne({
                        email: user.email?.toLowerCase()
                    });

                    if (!existingUser) {
                        // Create new user for OAuth
                        const newUser = new User({
                            name: user.name || profile?.name || 'User',
                            email: user.email?.toLowerCase(),
                            avatar: user.image || profile?.image,
                            emailVerified: true, // OAuth emails are pre-verified
                            role: 'user',
                            subscription: {
                                tier: 'free',
                                status: 'active'
                            },
                            settings: {
                                notifications: {
                                    email: true,
                                    newMessages: true,
                                    monthlyReports: true,
                                    systemUpdates: false
                                },
                                timezone: 'UTC',
                                language: 'en',
                                theme: 'light'
                            }
                        });

                        await newUser.save();
                        existingUser = newUser;
                    } else {
                        // Update last login for existing OAuth user
                        await User.findByIdAndUpdate(existingUser._id, {
                            $set: {
                                'security.lastLogin': new Date(),
                                'lastActiveAt': new Date(),
                                // Update avatar if changed
                                ...(user.image && { avatar: user.image })
                            }
                        });
                    }

                    // Update user object with database info
                    user.id = existingUser._id.toString();
                    user.role = existingUser.role;
                    user.subscription = existingUser.subscription;
                }

                return true;
            } catch (error) {
                console.error('SignIn callback error:', error);
                return false;
            }
        },

        async jwt({ token, user, account, profile, trigger, session }) {
            // Initial sign in
            const userData = user as {
                role?: string;
                subscription?: Subscription; // Ensure Subscription is defined
                emailVerified?: boolean;
            };
            token.role = userData.role;
            token.subscription = userData.subscription;
            token.emailVerified = userData.emailVerified;
            token.lastRefresh = Date.now(); // Optionally set lastRefresh here

            // Handle token updates
            if (trigger === 'update' && session) {
                // Update token with new session data
                if (session.subscription) {
                    token.subscription = session.subscription;
                }
                if (session.role) {
                    token.role = session.role;
                }
            }

            // Refresh user data from database periodically
            if (token.sub && Date.now() - (token.lastRefresh || 0) > 60 * 60 * 1000) { // 1 hour
                try {
                    await connectDB();
                    const dbUser = await User.findById(token.sub);

                    if (dbUser) {
                        token.role = dbUser.role;
                        token.subscription = dbUser.subscription;
                        token.emailVerified = dbUser.emailVerified;
                        token.lastRefresh = Date.now();
                    }
                } catch (error) {
                    console.error('JWT refresh error:', error);
                }
            }

            return token;
        },

        async session({ session, token }) {
            if (token) {
                session.user.id = token.sub!;
                session.user.role = token.role as "user" | "admin";
                session.user.subscription = token.subscription as any;
                session.user.emailVerified = token.emailVerified as boolean;
            }

            return session;
        },

        async redirect({ url, baseUrl }) {
            // Allows relative callback URLs
            if (url.startsWith("/")) return `${baseUrl}${url}`;
            // Allows callback URLs on the same origin
            else if (new URL(url).origin === baseUrl) return url;
            return baseUrl;
        }
    },

    events: {
        async signIn({ user, account, profile, isNewUser }) {
            console.log(`User signed in: ${user.email} via ${account?.provider}`);

            // Track sign-in events
            try {
                await connectDB();
                await User.findByIdAndUpdate(user.id, {
                    $set: { 'lastActiveAt': new Date() }
                });
            } catch (error) {
                console.error('SignIn event error:', error);
            }
        },

        async signOut({ token }) {
            console.log('User signed out:', token?.email);
        },

        async createUser({ user }) {
            console.log('New user created:', user.email);
            const email = await user.email ;
            const name = await user.name;
            // Send welcome email, analytics tracking, etc.
            if(name && email) await sendWelcomeEmail(email,name);
        },

        async linkAccount({ user, account, profile }) {
            console.log(`Account linked: ${account.provider} for ${user.email}`);
        },

        async session({ session, token }) {
            // Track active sessions if needed
        }
    },

    debug: process.env.NODE_ENV === 'development',

    // Add custom error handling
    logger: {
        error(code, metadata) {
            console.error('NextAuth Error:', code, metadata);
        },
        warn(code) {
            console.warn('NextAuth Warning:', code);
        },
        debug(code, metadata) {
            if (process.env.NODE_ENV === 'development') {
                console.log('NextAuth Debug:', code, metadata);
            }
        }
    }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };