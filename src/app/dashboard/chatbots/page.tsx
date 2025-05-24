'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSubscription } from '@/hooks/useSubscription';
import SubscriptionGuard from '@/components/SubscriptionGuard';

export default function ChatbotsPage() {
  const [chatbots, setChatbots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { canCreateChatbot } = useSubscription();

  useEffect(() => {
    fetchChatbots();
  }, []);

  const fetchChatbots = async () => {
    try {
      const response = await fetch('/api/chatbots');
      const data = await response.json();
      setChatbots(data.chatbots || []);
    } catch (error) {
      console.error('Failed to fetch chatbots:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredChatbots = chatbots.filter((chatbot: any) => {
    if (filter === 'active') return chatbot.isActive;
    if (filter === 'inactive') return !chatbot.isActive;
    return true;
  });

  const toggleChatbotStatus = async (chatbotId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/chatbots/${chatbotId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        fetchChatbots();
      }
    } catch (error) {
      console.error('Failed to toggle chatbot status:', error);
    }
  };

  const deleteChatbot = async (chatbotId: string) => {
    if (!confirm('Are you sure you want to delete this chatbot? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/chatbots/${chatbotId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchChatbots();
      }
    } catch (error) {
      console.error('Failed to delete chatbot:', error);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chatbots</h1>
          <p className="text-gray-600">Manage your chatbots and their settings</p>
        </div>
        {canCreateChatbot() ? (
          <Link
            href="/dashboard/chatbots/create"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Chatbot
          </Link>
        ) : (
          <SubscriptionGuard requiredTier="pro" fallback={
            <Link
              href="/dashboard/billing"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-400 cursor-not-allowed"
            >
              Upgrade to Create More
            </Link>
          }>
            <Link
              href="/dashboard/chatbots/create"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Chatbot
            </Link>
          </SubscriptionGuard>
        )}
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filter === 'all'
              ? 'bg-blue-100 text-blue-800'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All ({chatbots.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filter === 'active'
              ? 'bg-green-100 text-green-800'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Active ({chatbots.filter((c: any) => c.isActive).length})
        </button>
        <button
          onClick={() => setFilter('inactive')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filter === 'inactive'
              ? 'bg-gray-100 text-gray-800'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Inactive ({chatbots.filter((c: any) => !c.isActive).length})
        </button>
      </div>

      {/* Chatbots Grid */}
      {filteredChatbots.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChatbots.map((chatbot: any) => (
            <div key={chatbot._id} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  {chatbot.avatar ? (
                    <img
                      src={chatbot.avatar}
                      alt={chatbot.name}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 text-xl">🤖</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {chatbot.name}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">
                      {chatbot.description || 'No description'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      chatbot.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {chatbot.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Conversations</span>
                    <span className="text-sm font-medium text-gray-900">
                      {chatbot.analytics?.totalConversations || 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Messages</span>
                    <span className="text-sm font-medium text-gray-900">
                      {chatbot.analytics?.totalMessages || 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Created</span>
                    <span className="text-sm text-gray-900">
                      {new Date(chatbot.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <Link
                      href={`/dashboard/chatbots/${chatbot._id}`}
                      className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                    >
                      Configure
                    </Link>
                    <Link
                      href={`/dashboard/chatbots/${chatbot._id}/analytics`}
                      className="text-green-600 hover:text-green-500 text-sm font-medium"
                    >
                      Analytics
                    </Link>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => toggleChatbotStatus(chatbot._id, chatbot.isActive)}
                      className={`text-sm font-medium ${
                        chatbot.isActive
                          ? 'text-yellow-600 hover:text-yellow-500'
                          : 'text-green-600 hover:text-green-500'
                      }`}
                    >
                      {chatbot.isActive ? 'Pause' : 'Activate'}
                    </button>
                    <button
                      onClick={() => deleteChatbot(chatbot._id)}
                      className="text-red-600 hover:text-red-500 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🤖</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filter === 'all' ? 'No chatbots created yet' : `No ${filter} chatbots`}
          </h3>
          <p className="text-gray-600 mb-6">
            {filter === 'all' 
              ? 'Create your first chatbot to get started with automated conversations'
              : `You don't have any ${filter} chatbots at the moment`
            }
          </p>
          {filter === 'all' && canCreateChatbot() && (
            <Link
              href="/dashboard/chatbots/create"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Create Your First Chatbot
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
