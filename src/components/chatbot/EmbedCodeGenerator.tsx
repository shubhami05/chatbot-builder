'use client';

import { useState, useEffect } from 'react';

interface EmbedCodeGeneratorProps {
  chatbot: any;
}

export function EmbedCodeGenerator({ chatbot }: EmbedCodeGeneratorProps) {
  const [customization, setCustomization] = useState({
    autoOpen: false,
    openDelay: 3000,
    showUnreadCount: true,
    collectFeedback: true,
    customGreeting: '',
    customCSS: '',
  });

  const generateEmbedCode = () => {
    const baseUrl = process.env.NEXT_PUBLIC_WIDGET_URL || 'https://your-domain.com';
    const attributes = [
      `src="${baseUrl}/api/widget/${chatbot._id}"`,
      `data-chatbot-id="${chatbot._id}"`,
      `data-title="${chatbot.name}"`,
      `data-primary-color="${chatbot.styling?.primaryColor || '#007bff'}"`,
      `data-position="${chatbot.styling?.position || 'bottom-right'}"`,
      `data-greeting="${customization.customGreeting || chatbot.config?.greeting}"`,
      customization.autoOpen ? `data-auto-open="true"` : '',
      customization.autoOpen ? `data-open-delay="${customization.openDelay}"` : '',
      customization.showUnreadCount ? `data-show-unread="true"` : '',
      customization.collectFeedback ? `data-collect-feedback="true"` : '',
    ].filter(Boolean);

    return `<!-- ChatBot Builder Widget -->
<script ${attributes.join('\n        ')} async>
</script>

${customization.customCSS ? `
<!-- Custom Styling -->
<style>
${customization.customCSS}
</style>` : ''}

<!-- Optional: Custom Events -->
<script>
  // Listen for widget events
  window.addEventListener('chatbot-ready', function(e) {
    console.log('ChatBot loaded:', e.detail);
    
    // Optional: Send custom data
    e.detail.widget.setUserData({
      userId: 'user_123',
      email: 'user@example.com',
      plan: 'premium'
    });
  });

  window.addEventListener('chatbot-message-sent', function(e) {
    // Track message events
    gtag('event', 'chatbot_message', {
      'chatbot_id': '${chatbot._id}',
      'message_length': e.detail.message.length
    });
  });

  // Programmatic control
  function openChatbot() {
    if (window.ChatBotBuilder) {
      window.ChatBotBuilder.open();
    }
  }

  function sendMessage(message) {
    if (window.ChatBotBuilder) {
      window.ChatBotBuilder.sendBotMessage(message);
    }
  }
</script>`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">JavaScript Embed Code</h3>
        <p className="text-gray-600 mb-4">
          Copy and paste this code into your website's HTML, just before the closing &lt;/body&gt; tag.
        </p>
      </div>

      {/* Customization Options */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-4">
        <h4 className="font-medium text-gray-900">Embed Options</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="autoOpen"
              checked={customization.autoOpen}
              onChange={(e) => setCustomization(prev => ({ ...prev, autoOpen: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="autoOpen" className="ml-2 block text-sm text-gray-900">
              Auto-open widget
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="showUnreadCount"
              checked={customization.showUnreadCount}
              onChange={(e) => setCustomization(prev => ({ ...prev, showUnreadCount: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="showUnreadCount" className="ml-2 block text-sm text-gray-900">
              Show unread count
            </label>
          </div>
        </div>

        {customization.autoOpen && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Auto-open delay (seconds)
            </label>
            <input
              type="number"
              min="0"
              max="30"
              value={customization.openDelay / 1000}
              onChange={(e) => setCustomization(prev => ({ 
                ...prev, 
                openDelay: parseInt(e.target.value) * 1000 
              }))}
              className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Custom greeting (optional)
          </label>
          <input
            type="text"
            value={customization.customGreeting}
            onChange={(e) => setCustomization(prev => ({ ...prev, customGreeting: e.target.value }))}
            placeholder="Override default greeting..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Generated Code */}
      <div className="relative">
        <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto max-h-96">
          <code>{generateEmbedCode()}</code>
        </pre>
        <button
          onClick={() => navigator.clipboard.writeText(generateEmbedCode())}
          className="absolute top-2 right-2 px-3 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-600"
        >
          Copy Code
        </button>
      </div>
    </div>
  );
}