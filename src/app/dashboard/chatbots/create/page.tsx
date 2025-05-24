'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/hooks/useSubscription';
import ChatbotForm from '@/components/ChatbotForm';

export default function CreateChatbotPage() {
  const router = useRouter();
  const { canCreateChatbot } = useSubscription();
  const [loading, setLoading] = useState(false);

  if (!canCreateChatbot()) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔒</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Chatbot Limit Reached
        </h3>
        <p className="text-gray-600 mb-6">
          You've reached your chatbot limit. Upgrade your plan to create more chatbots.
        </p>
        <button
          onClick={() => router.push('/dashboard/billing')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          Upgrade Plan
        </button>
      </div>
    );
  }

  const handleSubmit = async (formData: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/chatbots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const { chatbot } = await response.json();
        router.push(`/dashboard/chatbots/${chatbot._id}`);
      } else {
        const { error } = await response.json();
        alert(error || 'Failed to create chatbot');
      }
    } catch (error) {
      console.error('Failed to create chatbot:', error);
      alert('Failed to create chatbot');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Create New Chatbot</h1>
        <p className="text-gray-600 mt-2">
          Set up your chatbot with basic information and initial configuration
        </p>
      </div>

      <ChatbotForm
        onSubmit={handleSubmit}
        loading={loading}
        submitText="Create Chatbot"
      />
    </div>
  );
}
