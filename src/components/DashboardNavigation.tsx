'use client';

import { JSX, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import UserMenu from './UserMenu';
import { useSubscription } from '@/hooks/useSubscription';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
    { name: 'Chatbots', href: '/dashboard/chatbots', icon: 'chatbots' },
    { name: 'Analytics', href: '/dashboard/analytics', icon: 'analytics' },
    { name: 'Integrations', href: '/dashboard/integrations', icon: 'integrations' },
    { name: 'Settings', href: '/dashboard/settings', icon: 'settings' },
];

const adminNavigation = [
    { name: 'Admin Panel', href: '/admin', icon: 'admin' },
    { name: 'Users', href: '/admin/users', icon: 'users' },
    { name: 'Subscriptions', href: '/admin/subscriptions', icon: 'subscriptions' },
];

export default function DashboardNavigation() {
    const { data: session } = useSession();
    const { subscription, subscriptionData } = useSubscription();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const isActive = (href: string) => {
        return pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
    };

    const getIcon = (iconName: string) => {
        const icons: Record<string, JSX.Element> = {
            dashboard: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6a2 2 0 01-2 2H10a2 2 0 01-2-2V5z" />
                </svg>
            ),
            chatbots: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            ),
            analytics: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
            integrations: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
            ),
            settings: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
            admin: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
            ),
            users: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
            ),
            subscriptions: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
            ),
        };
        return icons[iconName] || null;
    };

    return (
        <>
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Mobile sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                <div className="flex items-center justify-between h-16 px-4 border-b">
                    <Link href="/dashboard" className="text-xl font-bold text-gray-800">
                        Chatbot Builder
                    </Link>
                    <button
                        title='Sidebar'
                        type='button'
                        onClick={() => setSidebarOpen(false)}
                        className="p-2 rounded-md text-gray-400 hover:text-gray-600"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <SidebarContent
                    navigation={navigation}
                    adminNavigation={adminNavigation}
                    session={session}
                    isActive={isActive}
                    getIcon={getIcon}
                    subscriptionData={subscriptionData}
                />
            </div>

            {/* Desktop sidebar */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:w-64 lg:bg-white lg:shadow-lg">
                <div className="flex items-center h-16 px-4 border-b">
                    <Link href="/dashboard" className="text-xl font-bold text-gray-800">
                        Chatbot Builder
                    </Link>
                </div>
                <SidebarContent
                    navigation={navigation}
                    adminNavigation={adminNavigation}
                    session={session}
                    isActive={isActive}
                    getIcon={getIcon}
                    subscriptionData={subscriptionData}
                />
            </div>

            {/* Top bar */}
            <div className="lg:pl-64">
                <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
                    <button
                        type="button"
                        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <span className="sr-only">Open sidebar</span>
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        </svg>
                    </button>

                    <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                        <div className="flex flex-1 items-center">
                            {/* Breadcrumb or page title could go here */}
                        </div>
                        <div className="flex items-center gap-x-4 lg:gap-x-6">
                            {/* Notifications could go here */}
                            <UserMenu />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

// Sidebar content component
function SidebarContent({ navigation, adminNavigation, session, isActive, getIcon, subscriptionData }: any) {
    return (
        <div className="flex flex-col h-full">
            <nav className="flex-1 px-4 py-4 space-y-1">
                {navigation.map((item: any) => (
                    <Link
                        key={item.name}
                        href={item.href}
                        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${isActive(item.href)
                            ? 'bg-blue-100 text-blue-900'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                    >
                        {getIcon(item.icon)}
                        <span className="ml-3">{item.name}</span>
                    </Link>
                ))}

                {session?.user?.role === 'admin' && (
                    <>
                        <div className="border-t pt-4 mt-4">
                            <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Admin
                            </h3>
                            <div className="mt-2 space-y-1">
                                {adminNavigation.map((item: any) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${isActive(item.href)
                                            ? 'bg-red-100 text-red-900'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                            }`}
                                    >
                                        {getIcon(item.icon)}
                                        <span className="ml-3">{item.name}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </nav>

            {/* Subscription info at bottom */}
            {subscriptionData && (
                <div className="p-4 border-t">
                    <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900">
                                {subscriptionData?.tier?.charAt(0).toUpperCase() + subscriptionData?.tier?.slice(1)} Plan
                            </span>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${subscriptionData?.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                {subscriptionData?.status}
                            </span>
                        </div>

                        <div className="space-y-1 text-xs text-gray-600">
                            <div className="flex justify-between">
                                <span>Chatbots:</span>
                                <span>{subscriptionData.user?.usage?.chatbots || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Messages:</span>
                                <span>{subscriptionData.user?.usage?.monthlyMessages || 0}</span>
                            </div>
                        </div>

                        <Link
                            href="/dashboard/billing"
                            className="mt-2 block text-center text-xs text-blue-600 hover:text-blue-500"
                        >
                            Manage Billing
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
