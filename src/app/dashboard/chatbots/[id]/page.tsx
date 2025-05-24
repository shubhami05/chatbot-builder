'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Tab } from '@headlessui/react';
import BasicInfoTab from '@/components/chatbot/BasicInfoTab';
import ResponseConfigTab from '@/components/chatbot/ResponseConfigTab';
import StylingTab from '@/components/chatbot/StylingTab';
import FlowBuilderTab from '@/components/chatbot/FlowBuilderTab';
import AnalyticsTab from '@/components/chatbot/AnalyticsTab';
import IntegrationTab from '@/components/chatbot/IntegrationTab';

const tabs = [
  { name: 'Basic Info', component: BasicInfoTab },
  { name: 'Responses', component: ResponseConfigTab },
  { name: 'Styling', component: StylingTab },
  { name: 'Flow Builder', component: FlowBuilderTab },
  { name: 'Analytics', component: AnalyticsTab },
  { name: 'Integration', component: IntegrationTab },
];

export default function EditChatbotPage() {
  const params = useParams();
  const router = useRouter();
  const [chatbot, setChatbot] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);

  useEffect(() => {
    fetchChatbot();
  }, [params.id]);

  const fetchChatbot = async () => {
    try {
      const response = await fetch(`/api/chatbots/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setChatbot(data.chatbot);
      } else {
        router.push('/dashboard/chatbots');
      }
    } catch (error) {
      console.error('Failed to fetch chatbot:', error);
      router.push('/dashboard/chatbots');
    } finally {
      setLoading(false);
    }
  };

  const updateChatbot = async (updates: any) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/chatbots/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const data = await response.json();
        setChatbot(data.chatbot);
        return true;
      } else {
        const { error } = await response.json();
        alert(error || 'Failed to update chatbot');
        return false;
      }
    } catch (error) {
      console.error('Failed to update chatbot:', error);
      alert('Failed to update chatbot');
      return false;
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!chatbot) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🤖</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Chatbot Not Found
        </h3>
        <p className="text-gray-600 mb-6">
          The chatbot you're looking for doesn't exist or you don't have access to it.
        </p>
        <button
          onClick={() => router.push('/dashboard/chatbots')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          Back to Chatbots
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{chatbot.name}</h1>
            <p className="text-gray-600 mt-1">
              {chatbot.description || 'Configure your chatbot settings'}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
              chatbot.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {chatbot.isActive ? 'Active' : 'Inactive'}
            </span>
            <button
              onClick={() => router.push('/dashboard/chatbots')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back to Chatbots
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
        <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1 mb-8">
          {tabs.map((tab, index) => (
            <Tab
              key={tab.name}
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 ${
                  selected
                    ? 'bg-white text-blue-700 shadow'
                    : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'
                }`
              }
            >
              {tab.name}
            </Tab>
          ))}
        </Tab.List>

        <Tab.Panels>
          {tabs.map((tab, index) => (
            <Tab.Panel key={index}>
              <tab.component
                chatbot={chatbot}
                onUpdate={updateChatbot}
                saving={saving}
              />
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}