'use client';

import { useState } from 'react';

interface IntegrationTabProps {
  chatbot: any;
  onUpdate: (updates: any) => Promise<boolean>;
  saving: boolean;
}

export default function IntegrationTab({ chatbot, onUpdate, saving }: IntegrationTabProps) {
  const [integration, setIntegration] = useState({
    domains: chatbot.integration?.domains || [],
    webhookUrl: chatbot.integration?.webhookUrl || '',
    allowedOrigins: chatbot.integration?.allowedOrigins || [],
    rateLimiting: {
      enabled: chatbot.integration?.rateLimiting?.enabled !== false,
      requestsPerMinute: chatbot.integration?.rateLimiting?.requestsPerMinute || 60,
      requestsPerHour: chatbot.integration?.rateLimiting?.requestsPerHour || 1000
    }
  });

  const [newDomain, setNewDomain] = useState('');
  const [newOrigin, setNewOrigin] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdate({ integration });
  };

  const addDomain = () => {
    if (newDomain.trim() && !integration.domains.includes(newDomain.trim())) {
      setIntegration(prev => ({
        ...prev,
        domains: [...prev.domains, newDomain.trim()]
      }));
      setNewDomain('');
    }
  };

  const removeDomain = (domain: string) => {
    setIntegration(prev => ({
      ...prev,
      domains: prev.domains.filter((d: string) => d !== domain)
    }));
  };

  const addOrigin = () => {
    if (newOrigin.trim() && !integration.allowedOrigins.includes(newOrigin.trim())) {
      setIntegration(prev => ({
        ...prev,
        allowedOrigins: [...prev.allowedOrigins, newOrigin.trim()]
      }));
      setNewOrigin('');
    }
  };

  const removeOrigin = (origin: string) => {
    setIntegration(prev => ({
      ...prev,
      allowedOrigins: prev.allowedOrigins.filter((o: string) => o !== origin)
    }));
  };

  const embedCode = `<script src="${process.env.NEXT_PUBLIC_WIDGET_URL || 'https://your-domain.com/widget/chat-widget.js'}" 
        data-chatbot-id="${chatbot._id}"
        data-title="${chatbot.name}"
        data-primary-color="${chatbot.styling?.primaryColor || '#007bff'}">
</script>`;

  const reactComponentCode = `import { useEffect } from 'react';

export function ChatWidget() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '${process.env.NEXT_PUBLIC_WIDGET_URL || 'https://your-domain.com/widget/chat-widget.js'}';
    script.setAttribute('data-chatbot-id', '${chatbot._id}');
    script.setAttribute('data-title', '${chatbot.name}');
    script.setAttribute('data-primary-color', '${chatbot.styling?.primaryColor || '#007bff'}');
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return null;
}`;

  return (
    <div className="space-y-6">
      {/* Embed Code */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Embed Code</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              HTML/JavaScript Integration
            </label>
            <div className="relative">
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
                <code>{embedCode}</code>
              </pre>
              <button
                onClick={() => navigator.clipboard.writeText(embedCode)}
                className="absolute top-2 right-2 px-2 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-600"
              >
                Copy
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              React Component
            </label>
            <div className="relative">
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
                <code>{reactComponentCode}</code>
              </pre>
              <button
                onClick={() => navigator.clipboard.writeText(reactComponentCode)}
                className="absolute top-2 right-2 px-2 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-600"
              >
                Copy
              </button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Integration Instructions</h4>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1. Copy the embed code above</li>
              <li>2. Paste it before the closing &lt;/body&gt; tag on your website</li>
              <li>3. The chatbot will automatically appear on your site</li>
              <li>4. Configure allowed domains below for security</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Integration Settings */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Integration Settings</h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={chatbot.integration?.apiKey || ''}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
              />
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(chatbot.integration?.apiKey || '')}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                Copy
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Use this API key for direct API integrations
            </p>
          </div>

          {/* Allowed Domains */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Allowed Domains
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="example.com"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDomain())}
              />
              <button
                type="button"
                onClick={addDomain}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            <div className="space-y-2">
              {integration.domains.map((domain:any, index:any) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                  <span className="text-sm">{domain}</span>
                  <button
                    type="button"
                    onClick={() => removeDomain(domain)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {integration.domains.length === 0 && (
                <p className="text-sm text-gray-500">No domain restrictions (widget can be embedded anywhere)</p>
              )}
            </div>
          </div>

          {/* Webhook URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Webhook URL
            </label>
            <input
              type="url"
              value={integration.webhookUrl}
              onChange={(e) => setIntegration(prev => ({ ...prev, webhookUrl: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://your-api.com/webhooks/chatbot"
            />
            <p className="mt-1 text-sm text-gray-500">
              Receive real-time notifications when conversations start, end, or when leads are captured
            </p>
          </div>

          {/* CORS Origins */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Allowed CORS Origins
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={newOrigin}
                onChange={(e) => setNewOrigin(e.target.value)}
                placeholder="https://app.example.com"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOrigin())}
              />
              <button
                type="button"
                onClick={addOrigin}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            <div className="space-y-2">
              {integration.allowedOrigins.map((origin :any, index:any) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                  <span className="text-sm">{origin}</span>
                  <button
                    type="button"
                    onClick={() => removeOrigin(origin)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Rate Limiting */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Rate Limiting</h4>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="rateLimitingEnabled"
                  checked={integration.rateLimiting.enabled}
                  onChange={(e) => setIntegration(prev => ({
                    ...prev,
                    rateLimiting: { ...prev.rateLimiting, enabled: e.target.checked }
                  }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="rateLimitingEnabled" className="ml-2 block text-sm text-gray-900">
                  Enable rate limiting
                </label>
              </div>

              {integration.rateLimiting.enabled && (
                <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Requests per minute
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={integration.rateLimiting.requestsPerMinute}
                      onChange={(e) => setIntegration(prev => ({
                        ...prev,
                        rateLimiting: { ...prev.rateLimiting, requestsPerMinute: parseInt(e.target.value) || 60 }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Requests per hour
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10000"
                      value={integration.rateLimiting.requestsPerHour}
                      onChange={(e) => setIntegration(prev => ({
                        ...prev,
                        rateLimiting: { ...prev.rateLimiting, requestsPerHour: parseInt(e.target.value) || 1000 }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Integration Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* Testing */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Test Your Integration</h3>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => window.open(`/preview/${chatbot._id}`, '_blank')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview Chatbot
            </button>
            
            <button
              onClick={() => {
                // Test webhook if URL is provided
                if (integration.webhookUrl) {
                  fetch('/api/test-webhook', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                      webhookUrl: integration.webhookUrl,
                      chatbotId: chatbot._id 
                    })
                  }).then(res => {
                    if (res.ok) {
                      alert('Webhook test sent successfully!');
                    } else {
                      alert('Webhook test failed. Please check your URL.');
                    }
                  });
                } else {
                  alert('Please configure a webhook URL first.');
                }
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Test Webhook
            </button>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">Integration Checklist</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                Embed code copied and added to website
              </li>
              <li className="flex items-center">
                <span className="text-green-600 mr-2">✓</span>
                Allowed domains configured for security
              </li>
              <li className="flex items-center">
                <span className="text-yellow-600 mr-2">⚠</span>
                Webhook configured (optional)
              </li>
              <li className="flex items-center">
                <span className="text-yellow-600 mr-2">⚠</span>
                Rate limiting configured appropriately
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}