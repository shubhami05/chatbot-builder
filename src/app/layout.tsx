import './globals.css';
import { Inter } from 'next/font/google';
import AuthProvider from '@/components/AuthProvider';
import { getServerSession } from 'next-auth';
import { authOptions } from './api/auth/[...nextauth]/route';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Chatbot Builder - Create AI Chatbots in Minutes',
  description: 'Build, customize, and deploy AI-powered chatbots for your business. No coding required.',
  keywords: 'chatbot, AI, customer support, automation, SaaS',
  authors: [{ name: 'Chatbot Builder Team' }],
  openGraph: {
    title: 'Chatbot Builder - Create AI Chatbots in Minutes',
    description: 'Build, customize, and deploy AI-powered chatbots for your business. No coding required.',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'Chatbot Builder',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chatbot Builder - Create AI Chatbots in Minutes',
    description: 'Build, customize, and deploy AI-powered chatbots for your business. No coding required.',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider session={session}>
          <section className="min-h-screen bg-gray-950">
            {children}
          </section>
        </AuthProvider>
      </body>
    </html>
  );
}