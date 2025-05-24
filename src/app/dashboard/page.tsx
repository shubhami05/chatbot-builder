'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useSubscription } from '@/hooks/useSubscription';
import SubscriptionGuard from '@/components/SubscriptionGuard';

interface DashboardStats {
  totalChatbots: number;
  totalConversations: number;
  totalMessages: number;
  activeConversations: number;
  monthlyMessageUsage: number;
  conversionRate: number;
}

interface RecentActivity {
  id: string;
  type: 'conversation' | 'chatbot_created' | 'message_sent';
  chatbotName: string;
  description: string;
  timestamp: string;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const { subscription, subscriptionData, canCreateChatbot, canSendMessage } = useSubscription();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [chatbots, setChatbots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, activityRes, chatbotsRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/dashboard/activity'),
        fetch('/api/chatbots')
      ]);

      const [statsData, activityData, chatbotsData] = await Promise.all([
        statsRes.json(),
        activityRes.json(),
        chatbotsRes.json()
      ]);

      setStats(statsData.stats);
      setRecentActivity(activityData.activities || []);
      setChatbots(chatbotsData.chatbots || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {session?.user?.name}! 👋
            </h1>
            <p className="mt-1 text-gray-600">
              Here's what's happening with your chatbots today.
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Current Plan</div>
            <div className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
              subscription?.tier === 'free' ? 'bg-gray-100 text-gray-800' :
              subscription?.tier === 'pro' ? 'bg-blue-100 text-blue-800' :
              'bg-purple-100 text-purple-800'
            }`}>
              {subscription && subscription?.tier?.charAt(0).toUpperCase() + subscription?.tier?.slice(1)}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Chatbots"
          value={stats?.totalChatbots || 0}
          icon="🤖"
          color="blue"
          change="+2 this week"
        />
        <StatCard
          title="Conversations"
          value={stats?.totalConversations || 0}
          icon="💬"
          color="green"
          change="+12% from last month"
        />
        <StatCard
          title="Messages"
          value={stats?.totalMessages || 0}
          icon="📝"
          color="purple"
          change={`${stats?.monthlyMessageUsage || 0} this month`}
        />
        <StatCard
          title="Conversion Rate"
          value={`${((stats?.conversionRate || 0) * 100).toFixed(1)}%`}
          icon="📈"
          color="yellow"
          change="+5.2% from last week"
        />
      </div>

      {/* Usage Limits */}
      {subscriptionData && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Usage Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <UsageBar
              label="Chatbots"
              current={subscriptionData.user?.usage?.chatbots || 0}
              limit={subscriptionData.subscription?.plan?.limits?.chatbots || 1}
              color="blue"
            />
            <UsageBar
              label="Monthly Messages"
              current={subscriptionData.user?.usage?.monthlyMessages || 0}
              limit={subscriptionData.subscription?.plan?.limits?.messagesPerMonth || 100}
              color="green"
            />
            <UsageBar
              label="API Calls"
              current={subscriptionData.user?.usage?.apiCalls || 0}
              limit={subscriptionData.subscription?.plan?.limits?.apiCallsPerMonth || 1000}
              color="purple"
            />
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create New Chatbot */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
              {canCreateChatbot() ? (
                <Link href="/dashboard/chatbots/create" className="block">
                  <div className="text-4xl mb-2">🤖</div>
                  <h3 className="text-lg font-medium text-gray-900">Create New Chatbot</h3>
                  <p className="text-gray-600">Get started with a new chatbot in minutes</p>
                </Link>
              ) : (
                <SubscriptionGuard requiredTier="pro" fallback={
                  <div>
                    <div className="text-4xl mb-2">🔒</div>
                    <h3 className="text-lg font-medium text-gray-900">Upgrade Required</h3>
                    <p className="text-gray-600 mb-4">You've reached your chatbot limit</p>
                    <Link
                      href="/dashboard/billing"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Upgrade Plan
                    </Link>
                  </div>
                }>
                  <Link href="/dashboard/chatbots/create" className="block">
                    <div className="text-4xl mb-2">🤖</div>
                    <h3 className="text-lg font-medium text-gray-900">Create New Chatbot</h3>
                    <p className="text-gray-600">Get started with a new chatbot in minutes</p>
                  </Link>
                </SubscriptionGuard>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Link
                href="/dashboard/analytics"
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="text-2xl mb-2">📊</div>
                <div className="text-sm font-medium text-gray-900">Analytics</div>
              </Link>
              <Link
                href="/dashboard/integrations"
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="text-2xl mb-2">🔗</div>
                <div className="text-sm font-medium text-gray-900">Integrations</div>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    activity.type === 'conversation' ? 'bg-green-100' :
                    activity.type === 'chatbot_created' ? 'bg-blue-100' :
                    'bg-purple-100'
                  }`}>
                    {activity.type === 'conversation' ? '💬' :
                     activity.type === 'chatbot_created' ? '🤖' : '📝'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.chatbotName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-2">📭</div>
                <p>No recent activity</p>
                <p className="text-sm">Create your first chatbot to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chatbots Overview */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Your Chatbots</h2>
          <Link
            href="/dashboard/chatbots"
            className="text-blue-600 hover:text-blue-500 text-sm font-medium"
          >
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chatbots.slice(0, 6).map((chatbot: any) => (
            <ChatbotCard key={chatbot._id} chatbot={chatbot} />
          ))}
          {chatbots.length === 0 && (
            <div className="col-span-full text-center text-gray-500 py-8">
              <div className="text-4xl mb-2">🤖</div>
              <p>No chatbots created yet</p>
              <p className="text-sm">Create your first chatbot to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value, icon, color, change }: {
  title: string;
  value: string | number;
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'yellow';
  change?: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    yellow: 'bg-yellow-50 text-yellow-600',
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-md ${colorClasses[color]}`}>
          <span className="text-2xl">{icon}</span>
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {change && (
            <p className="text-xs text-gray-500 mt-1">{change}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Usage Bar Component
function UsageBar({ label, current, limit, color }: {
  label: string;
  current: number;
  limit: number;
  color: 'blue' | 'green' | 'purple';
}) {
  const percentage = limit === -1 ? 0 : Math.min((current / limit) * 100, 100);
  const isUnlimited = limit === -1;
  
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
  };

  return (
    <div>
      <div className="flex justify-between text-sm font-medium text-gray-900 mb-2">
        <span>{label}</span>
        <span>
          {current} {isUnlimited ? '' : `/ ${limit.toLocaleString()}`}
          {isUnlimited && <span className="text-green-600 ml-1">Unlimited</span>}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${colorClasses[color]} ${
            percentage > 80 ? 'bg-red-500' : ''
          }`}
          style={{ width: isUnlimited ? '100%' : `${percentage}%` }}
        ></div>
      </div>
      {!isUnlimited && percentage > 80 && (
        <p className="text-xs text-red-600 mt-1">
          {percentage > 95 ? 'Limit almost reached!' : 'Approaching limit'}
        </p>
      )}
    </div>
  );
}

// Chatbot Card Component
function ChatbotCard({ chatbot }: { chatbot: any }) {
  return (
    <Link href={`/dashboard/chatbots/${chatbot._id}`}>
      <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center space-x-3 mb-3">
          {chatbot.avatar ? (
            <img
              src={chatbot.avatar}
              alt={chatbot.name}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-600 text-lg">🤖</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {chatbot.name}
            </h3>
            <p className="text-xs text-gray-500">
              {chatbot.description || 'No description'}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className={`inline-flex px-2 py-1 rounded-full ${
            chatbot.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {chatbot.isActive ? 'Active' : 'Inactive'}
          </span>
          <span>{chatbot.analytics?.totalConversations || 0} conversations</span>
        </div>
      </div>
    </Link>
  );
}