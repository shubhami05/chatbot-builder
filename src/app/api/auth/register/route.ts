import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongoose';
import { User } from '@/models/user';
import { sendVerificationEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
    try {
        const { name, email, password } = await request.json();

        // Validation
        if (!name || !email || !password) {
            return NextResponse.json(
                { error: 'Name, email, and password are required' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters long' },
                { status: 400 }
            );
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Please enter a valid email address' },
                { status: 400 }
            );
        }

        await connectDB();

        // Check if user already exists
        const existingUser = await User.findOne({
            email: email.toLowerCase()
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Generate email verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Create user
        const user = new User({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            emailVerified: false,
            role: 'user',
            subscription: {
                tier: 'free',
                status: 'active',
                cancelAtPeriodEnd: false
            },
            usage: {
                chatbots: 0,
                messages: 0,
                monthlyMessages: 0,
                lastResetDate: new Date(),
                apiCalls: 0,
                storage: 0
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
            },
            security: {
                loginAttempts: 0,
                emailVerificationToken: verificationToken,
                twoFactorEnabled: false
            }
        });

        await user.save();

        // Send verification email
        try {
            await sendVerificationEmail(user.email, user.name, verificationToken);
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
            // Don't fail registration if email fails
        }

        return NextResponse.json(
            {
                message: 'Account created successfully. Please check your email to verify your account.',
                userId: user._id
            },
            { status: 201 }
        );

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}