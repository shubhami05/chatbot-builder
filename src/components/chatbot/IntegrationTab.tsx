// components/chatbot/IntegrationTab.tsx
'use client';

import { useState } from 'react';
import { Tab } from '@headlessui/react';

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

  const [selectedIntegration, setSelectedIntegration] = useState(0);
  const [newDomain, setNewDomain] = useState('');
  const [newOrigin, setNewOrigin] = useState('');

  const integrationMethods = [
    { name: 'JavaScript', id: 'javascript' },
    { name: 'React Component', id: 'react' },
    { name: 'WordPress Plugin', id: 'wordpress' },
    { name: 'REST API', id: 'api' },
    { name: 'Settings', id: 'settings' }
  ];

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

  // Generate different integration codes
  const generateJavaScriptCode = () => {
    const baseUrl = process.env.NEXT_PUBLIC_WIDGET_URL || 'https://your-domain.com';
    return `<!-- ChatBot Builder - JavaScript Integration -->
<script>
  (function() {
    var s = document.createElement('script');
    s.type = 'text/javascript';
    s.async = true;
    s.src = '${baseUrl}/api/widget/${chatbot._id}';
    s.setAttribute('data-chatbot-id', '${chatbot._id}');
    s.setAttribute('data-title', '${chatbot.name}');
    s.setAttribute('data-primary-color', '${chatbot.styling?.primaryColor || '#007bff'}');
    s.setAttribute('data-position', '${chatbot.styling?.position || 'bottom-right'}');
    s.setAttribute('data-greeting', '${chatbot.config?.greeting || 'Hello! How can I help you?'}');
    
    var x = document.getElementsByTagName('script')[0];
    x.parentNode.insertBefore(s, x);
  })();
</script>

<!-- Alternative: Direct script tag -->
<script 
  src="${baseUrl}/api/widget/${chatbot._id}"
  data-chatbot-id="${chatbot._id}"
  data-title="${chatbot.name}"
  data-primary-color="${chatbot.styling?.primaryColor || '#007bff'}"
  data-position="${chatbot.styling?.position || 'bottom-right'}"
  data-greeting="${chatbot.config?.greeting || 'Hello! How can I help you?'}"
  async>
</script>`;
  };

  const generateReactCode = () => {
    return `import React, { useEffect } from 'react';

// Option 1: React Hook for ChatBot Integration
export function useChatBot(config) {
  useEffect(() => {
    // Load ChatBot script
    const script = document.createElement('script');
    script.src = '${process.env.NEXT_PUBLIC_WIDGET_URL || 'https://your-domain.com'}/api/widget/${chatbot._id}';
    script.async = true;
    
    // Set configuration attributes
    Object.keys(config).forEach(key => {
      script.setAttribute(\`data-\${key.replace(/([A-Z])/g, '-$1').toLowerCase()}\`, config[key]);
    });
    
    document.body.appendChild(script);
    
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      // Clean up ChatBot instance
      if (window.ChatBotBuilder) {
        window.ChatBotBuilder.destroy();
      }
    };
  }, [config]);
}

// Option 2: React Component
export function ChatBotWidget({ 
  chatbotId = '${chatbot._id}',
  title = '${chatbot.name}',
  primaryColor = '${chatbot.styling?.primaryColor || '#007bff'}',
  position = '${chatbot.styling?.position || 'bottom-right'}',
  greeting = '${chatbot.config?.greeting || 'Hello! How can I help you?'}',
  autoOpen = false,
  openDelay = 3000,
  ...props 
}) {
  const chatBotConfig = {
    chatbotId,
    title,
    primaryColor,
    position,
    greeting,
    autoOpen: autoOpen.toString(),
    openDelay: openDelay.toString()
  };
  
  useChatBot(chatBotConfig);
  
  return null; // Widget is rendered by the script
}

// Option 3: Manual Integration Component
export function ManualChatBot({ children, onMessage, onOpen, onClose }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [messages, setMessages] = React.useState([]);
  
  const sendMessage = async (content) => {
    const response = await fetch('/api/conversations/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatbotId: '${chatbot._id}',
        sessionId: \`session_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`,
        message: content,
        visitorInfo: {
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      })
    });
    
    const data = await response.json();
    if (onMessage) onMessage(data);
    return data;
  };
  
  return (
    <>
      {children({ 
        sendMessage, 
        isOpen, 
        setIsOpen, 
        messages, 
        setMessages 
      })}
    </>
  );
}

// Usage Examples:
/*
// Hook Usage:
function App() {
  useChatBot({
    chatbotId: '${chatbot._id}',
    title: '${chatbot.name}',
    primaryColor: '${chatbot.styling?.primaryColor || '#007bff'}'
  });
  
  return <div>Your App Content</div>;
}

// Component Usage:
function App() {
  return (
    <div>
      <h1>Your App</h1>
      <ChatBotWidget 
        autoOpen={true}
        openDelay={5000}
        onReady={() => console.log('ChatBot ready!')}
      />
    </div>
  );
}

// Manual Integration:
function CustomChat() {
  return (
    <ManualChatBot 
      onMessage={(data) => console.log('Bot response:', data)}
    >
      {({ sendMessage, isOpen, setIsOpen }) => (
        <div>
          <button onClick={() => setIsOpen(!isOpen)}>
            Chat Support
          </button>
          {isOpen && (
            <div>Custom chat interface here</div>
          )}
        </div>
      )}
    </ManualChatBot>
  );
}
*/`;
  };

  const generateWordPressCode = () => {
    return `<?php
/**
 * Plugin Name: ChatBot Builder Integration
 * Description: Integrate ChatBot Builder widgets into your WordPress site
 * Version: 1.0.0
 * Author: ChatBot Builder
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class ChatBotBuilderWP {
    private $chatbot_id = '${chatbot._id}';
    private $widget_url = '${process.env.NEXT_PUBLIC_WIDGET_URL || 'https://your-domain.com'}';
    
    public function __construct() {
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_action('wp_footer', array($this, 'render_widget'));
        add_action('admin_menu', array($this, 'admin_menu'));
        add_action('admin_init', array($this, 'admin_init'));
        
        // Shortcode support
        add_shortcode('chatbot_builder', array($this, 'shortcode'));
    }
    
    public function enqueue_scripts() {
        if (get_option('chatbot_builder_enabled', true)) {
            wp_enqueue_script(
                'chatbot-builder',
                $this->widget_url . '/api/widget/' . $this->chatbot_id,
                array(),
                '1.0.0',
                true
            );
        }
    }
    
    public function render_widget() {
        if (!get_option('chatbot_builder_enabled', true)) return;
        
        $config = $this->get_config();
        echo $this->generate_widget_script($config);
    }
    
    public function shortcode($atts) {
        $atts = shortcode_atts(array(
            'id' => $this->chatbot_id,
            'title' => '${chatbot.name}',
            'position' => '${chatbot.styling?.position || 'bottom-right'}',
            'color' => '${chatbot.styling?.primaryColor || '#007bff'}',
            'greeting' => '${chatbot.config?.greeting || 'Hello! How can I help you?'}',
            'auto-open' => 'false',
            'inline' => 'false'
        ), $atts);
        
        if ($atts['inline'] === 'true') {
            return $this->generate_inline_widget($atts);
        }
        
        return $this->generate_widget_script($atts);
    }
    
    private function get_config() {
        return array(
            'chatbot-id' => get_option('chatbot_builder_id', $this->chatbot_id),
            'title' => get_option('chatbot_builder_title', '${chatbot.name}'),
            'primary-color' => get_option('chatbot_builder_color', '${chatbot.styling?.primaryColor || '#007bff'}'),
            'position' => get_option('chatbot_builder_position', '${chatbot.styling?.position || 'bottom-right'}'),
            'greeting' => get_option('chatbot_builder_greeting', '${chatbot.config?.greeting || 'Hello! How can I help you?'}'),
            'auto-open' => get_option('chatbot_builder_auto_open', 'false'),
            'open-delay' => get_option('chatbot_builder_open_delay', '3000')
        );
    }
    
    private function generate_widget_script($config) {
        $attributes = '';
        foreach ($config as $key => $value) {
            $attributes .= " data-{$key}=\"" . esc_attr($value) . "\"";
        }
        
        return "<script src=\"{$this->widget_url}/api/widget/{$this->chatbot_id}\"{$attributes} async></script>";
    }
    
    private function generate_inline_widget($config) {
        // For inline widgets, return a div that will be replaced by the widget
        return '<div id="chatbot-inline-' . uniqid() . '" class="chatbot-inline-widget" ' . 
               'data-chatbot-config="' . esc_attr(json_encode($config)) . '"></div>';
    }
    
    public function admin_menu() {
        add_options_page(
            'ChatBot Builder Settings',
            'ChatBot Builder',
            'manage_options',
            'chatbot-builder',
            array($this, 'admin_page')
        );
    }
    
    public function admin_init() {
        register_setting('chatbot_builder_settings', 'chatbot_builder_enabled');
        register_setting('chatbot_builder_settings', 'chatbot_builder_id');
        register_setting('chatbot_builder_settings', 'chatbot_builder_title');
        register_setting('chatbot_builder_settings', 'chatbot_builder_color');
        register_setting('chatbot_builder_settings', 'chatbot_builder_position');
        register_setting('chatbot_builder_settings', 'chatbot_builder_greeting');
        register_setting('chatbot_builder_settings', 'chatbot_builder_auto_open');
        register_setting('chatbot_builder_settings', 'chatbot_builder_open_delay');
    }
    
    public function admin_page() {
        ?>
        <div class="wrap">
            <h1>ChatBot Builder Settings</h1>
            <form method="post" action="options.php">
                <?php
                settings_fields('chatbot_builder_settings');
                do_settings_sections('chatbot_builder_settings');
                ?>
                <table class="form-table">
                    <tr>
                        <th scope="row">Enable ChatBot</th>
                        <td>
                            <input type="checkbox" name="chatbot_builder_enabled" value="1" 
                                   <?php checked(1, get_option('chatbot_builder_enabled', 1)); ?> />
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">ChatBot ID</th>
                        <td>
                            <input type="text" name="chatbot_builder_id" 
                                   value="<?php echo esc_attr(get_option('chatbot_builder_id', $this->chatbot_id)); ?>" 
                                   class="regular-text" />
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Widget Title</th>
                        <td>
                            <input type="text" name="chatbot_builder_title" 
                                   value="<?php echo esc_attr(get_option('chatbot_builder_title', '${chatbot.name}')); ?>" 
                                   class="regular-text" />
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Primary Color</th>
                        <td>
                            <input type="color" name="chatbot_builder_color" 
                                   value="<?php echo esc_attr(get_option('chatbot_builder_color', '${chatbot.styling?.primaryColor || '#007bff'}')); ?>" />
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Position</th>
                        <td>
                            <select name="chatbot_builder_position">
                                <option value="bottom-right" <?php selected(get_option('chatbot_builder_position'), 'bottom-right'); ?>>Bottom Right</option>
                                <option value="bottom-left" <?php selected(get_option('chatbot_builder_position'), 'bottom-left'); ?>>Bottom Left</option>
                                <option value="top-right" <?php selected(get_option('chatbot_builder_position'), 'top-right'); ?>>Top Right</option>
                                <option value="top-left" <?php selected(get_option('chatbot_builder_position'), 'top-left'); ?>>Top Left</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Greeting Message</th>
                        <td>
                            <textarea name="chatbot_builder_greeting" rows="3" cols="50"><?php 
                                echo esc_textarea(get_option('chatbot_builder_greeting', '${chatbot.config?.greeting || 'Hello! How can I help you?'}')); 
                            ?></textarea>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Auto-open Widget</th>
                        <td>
                            <input type="checkbox" name="chatbot_builder_auto_open" value="true" 
                                   <?php checked(get_option('chatbot_builder_auto_open'), 'true'); ?> />
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Auto-open Delay (ms)</th>
                        <td>
                            <input type="number" name="chatbot_builder_open_delay" 
                                   value="<?php echo esc_attr(get_option('chatbot_builder_open_delay', '3000')); ?>" 
                                   min="0" max="30000" />
                        </td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>
            
            <h2>Shortcode Usage</h2>
            <p>You can also use shortcodes to place chatbots in specific locations:</p>
            <code>[chatbot_builder]</code> - Default widget<br>
            <code>[chatbot_builder title="Custom Support" color="#ff0000"]</code> - Custom settings<br>
            <code>[chatbot_builder inline="true"]</code> - Inline widget (embedded in content)
        </div>
        <?php
    }
}

// Initialize the plugin
new ChatBotBuilderWP();

// Installation hook
register_activation_hook(__FILE__, 'chatbot_builder_activate');
function chatbot_builder_activate() {
    add_option('chatbot_builder_enabled', true);
    add_option('chatbot_builder_id', '${chatbot._id}');
    add_option('chatbot_builder_title', '${chatbot.name}');
    add_option('chatbot_builder_color', '${chatbot.styling?.primaryColor || '#007bff'}');
    add_option('chatbot_builder_position', '${chatbot.styling?.position || 'bottom-right'}');
    add_option('chatbot_builder_greeting', '${chatbot.config?.greeting || 'Hello! How can I help you?'}');
}

// Deactivation hook
register_deactivation_hook(__FILE__, 'chatbot_builder_deactivate');
function chatbot_builder_deactivate() {
    // Clean up if needed
}
?>`;
  };

  const generateAPIDocumentation = () => {
    return `# ChatBot Builder REST API Documentation

## Base URL
\`${process.env.NEXT_PUBLIC_API_URL || 'https://your-domain.com/api'}\`

## Authentication
Most chatbot interaction endpoints are public. For management operations, include your API key:
\`\`\`
Authorization: Bearer ${chatbot.integration?.apiKey || 'your-api-key'}
\`\`\`

## Endpoints

### 1. Send Message to ChatBot
\`\`\`http
POST /conversations/message
Content-Type: application/json

{
  "chatbotId": "${chatbot._id}",
  "sessionId": "session_unique_id",
  "message": "Hello, I need help!",
  "visitorInfo": {
    "ip": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "referrer": "https://example.com",
    "url": "https://example.com/contact"
  },
  "metadata": {
    "customField": "value"
  }
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "message": {
    "id": "msg_12345",
    "type": "bot",
    "content": "Hello! How can I help you today?",
    "timestamp": "2024-01-01T12:00:00Z",
    "metadata": {
      "confidence": 0.95,
      "processingTime": 150
    }
  },
  "conversationId": "conv_67890",
  "sessionId": "session_unique_id"
}
\`\`\`

### 2. Get Conversation History
\`\`\`http
GET /conversations/{conversationId}
Authorization: Bearer your-api-key
\`\`\`

**Response:**
\`\`\`json
{
  "conversation": {
    "id": "conv_67890",
    "sessionId": "session_unique_id",
    "status": "active",
    "startedAt": "2024-01-01T12:00:00Z",
    "messages": [
      {
        "id": "msg_1",
        "type": "user",
        "content": "Hello",
        "timestamp": "2024-01-01T12:00:00Z"
      },
      {
        "id": "msg_2",
        "type": "bot",
        "content": "Hi there! How can I help?",
        "timestamp": "2024-01-01T12:00:01Z"
      }
    ],
    "lead": {
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
}
\`\`\`

### 3. Update Chatbot Configuration
\`\`\`http
PATCH /chatbots/${chatbot._id}
Authorization: Bearer your-api-key
Content-Type: application/json

{
  "config": {
    "greeting": "Welcome to our support!",
    "collectEmail": true
  },
  "styling": {
    "primaryColor": "#ff6b6b"
  }
}
\`\`\`

### 4. Get Analytics
\`\`\`http
GET /chatbots/${chatbot._id}/analytics?period=30
Authorization: Bearer your-api-key
\`\`\`

**Response:**
\`\`\`json
{
  "analytics": {
    "summary": {
      "totalConversations": 150,
      "totalMessages": 450,
      "avgSessionDuration": 180,
      "conversionRate": 0.15
    },
    "dailyStats": [
      {
        "date": "2024-01-01",
        "conversations": 10,
        "messages": 30
      }
    ]
  }
}
\`\`\`

### 5. Webhook Events
Configure a webhook URL to receive real-time events:

**Event Types:**
- \`conversation.started\`
- \`conversation.ended\`
- \`message.received\`
- \`lead.captured\`

**Webhook Payload:**
\`\`\`json
{
  "event": "message.received",
  "chatbotId": "${chatbot._id}",
  "conversationId": "conv_67890",
  "sessionId": "session_unique_id",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "message": {
      "id": "msg_12345",
      "type": "user",
      "content": "I need help with my order"
    },
    "visitor": {
      "ip": "192.168.1.1",
      "location": "New York, US"
    }
  }
}
\`\`\`

## SDKs and Libraries

### JavaScript/Node.js
\`\`\`javascript
const ChatBotAPI = require('@chatbot-builder/sdk');

const client = new ChatBotAPI({
  apiKey: 'your-api-key',
  baseURL: '${process.env.NEXT_PUBLIC_API_URL || 'https://your-domain.com/api'}'
});

// Send message
const response = await client.sendMessage({
  chatbotId: '${chatbot._id}',
  sessionId: 'unique-session',
  message: 'Hello!'
});

console.log(response.message.content);
\`\`\`

### Python
\`\`\`python
import requests

class ChatBotAPI:
    def __init__(self, api_key, base_url='${process.env.NEXT_PUBLIC_API_URL || 'https://your-domain.com/api'}'):
        self.api_key = api_key
        self.base_url = base_url
        
    def send_message(self, chatbot_id, session_id, message, visitor_info=None):
        response = requests.post(
            f'{self.base_url}/conversations/message',
            json={
                'chatbotId': chatbot_id,
                'sessionId': session_id,
                'message': message,
                'visitorInfo': visitor_info or {}
            }
        )
        return response.json()

# Usage
client = ChatBotAPI('your-api-key')
response = client.send_message('${chatbot._id}', 'session-123', 'Hello!')
print(response['message']['content'])
\`\`\`

### cURL Examples
\`\`\`bash
# Send message
curl -X POST "${process.env.NEXT_PUBLIC_API_URL || 'https://your-domain.com/api'}/conversations/message" \\
  -H "Content-Type: application/json" \\
  -d '{
    "chatbotId": "${chatbot._id}",
    "sessionId": "session_123",
    "message": "Hello!",
    "visitorInfo": {
      "url": "https://example.com"
    }
  }'

# Get analytics (requires API key)
curl -X GET "${process.env.NEXT_PUBLIC_API_URL || 'https://your-domain.com/api'}/chatbots/${chatbot._id}/analytics" \\
  -H "Authorization: Bearer your-api-key"
\`\`\`

## Rate Limits
- Public endpoints: ${integration.rateLimiting.requestsPerMinute} requests/minute
- Authenticated endpoints: ${integration.rateLimiting.requestsPerHour} requests/hour

## Error Codes
- \`400\`: Bad Request - Invalid parameters
- \`401\`: Unauthorized - Invalid or missing API key
- \`403\`: Forbidden - Insufficient permissions
- \`404\`: Not Found - Resource not found
- \`429\`: Too Many Requests - Rate limit exceeded
- \`500\`: Internal Server Error

## Support
For API support, contact: api-support@chatbot-builder.com`;
  };

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <Tab.Group selectedIndex={selectedIntegration} onChange={setSelectedIntegration}>
        <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1">
          {integrationMethods.map((method) => (
            <Tab
              key={method.id}
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 ${
                  selected
                    ? 'bg-white text-blue-700 shadow'
                    : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'
                }`
              }
            >
              {method.name}
            </Tab>
          ))}
        </Tab.List>

        <Tab.Panels className="mt-6">
          {/* JavaScript Integration */}
          <Tab.Panel>
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">JavaScript Integration</h3>
              <p className="text-gray-600 mb-4">
                The easiest way to add your chatbot to any website. Just copy and paste this code before the closing &lt;/body&gt; tag.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Embed Code
                  </label>
                  <div className="relative">
                    <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto max-h-96">
                      <code>{generateJavaScriptCode()}</code>
                    </pre>
                    <button
                      onClick={() => navigator.clipboard.writeText(generateJavaScriptCode())}
                      className="absolute top-2 right-2 px-3 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-600"
                    >
                      Copy Code
                    </button>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Configuration Options</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <div><strong>data-chatbot-id:</strong> Your chatbot ID (required)</div>
                    <div><strong>data-title:</strong> Widget title</div>
                    <div><strong>data-primary-color:</strong> Widget color theme</div>
                    <div><strong>data-position:</strong> bottom-right, bottom-left, top-right, top-left</div>
                    <div><strong>data-greeting:</strong> Initial greeting message</div>
                    <div><strong>data-auto-open:</strong> Auto-open widget (true/false)</div>
                    <div><strong>data-open-delay:</strong> Auto-open delay in milliseconds</div>
                  </div>
                </div>
              </div>
            </div>
          </Tab.Panel>

          {/* React Component */}
          <Tab.Panel>
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">React Component Integration</h3>
              <p className="text-gray-600 mb-4">
                Use our React components and hooks for seamless integration with React applications.
              </p>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      NPM Package Installation
                    </label>
                  </div>
                  <div className="relative">
                    <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm">
                      <code>{`npm install @chatbot-builder/react
# or
yarn add @chatbot-builder/react`}</code>
                    </pre>
                    <button
                      onClick={() => navigator.clipboard.writeText('npm install @chatbot-builder/react')}
                      className="absolute top-2 right-2 px-3 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-600"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    React Components & Hooks
                  </label>
                  <div className="relative">
                    <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto max-h-96">
                      <code>{generateReactCode()}</code>
                    </pre>
                    <button
                      onClick={() => navigator.clipboard.writeText(generateReactCode())}
                      className="absolute top-2 right-2 px-3 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-600"
                    >
                      Copy Code
                    </button>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-green-800 mb-2">Features</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• TypeScript support with full type definitions</li>
                    <li>• React hooks for easy integration</li>
                    <li>• Event callbacks for custom handling</li>
                    <li>• SSR (Server-Side Rendering) compatible</li>
                    <li>• Automatic cleanup on unmount</li>
                    <li>• Custom styling and theming options</li>
                  </ul>
                </div>
              </div>
            </div>
          </Tab.Panel>

          {/* WordPress Plugin */}
          <Tab.Panel>
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">WordPress Plugin Integration</h3>
              <p className="text-gray-600 mb-4">
                Install our WordPress plugin for easy integration with WordPress sites, including admin panel and shortcode support.
              </p>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Installation Methods</h4>
                    <div className="text-sm text-blue-700 space-y-2">
                      <div>
                        <strong>Method 1:</strong> WordPress Plugin Directory
                        <br />
                        <span className="text-xs">Search for "ChatBot Builder" in your WordPress admin</span>
                      </div>
                      <div>
                        <strong>Method 2:</strong> Manual Upload
                        <br />
                        <span className="text-xs">Upload the plugin ZIP file via admin panel</span>
                      </div>
                      <div>
                        <strong>Method 3:</strong> Custom PHP Code
                        <br />
                        <span className="text-xs">Copy the code below to your functions.php</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-purple-800 mb-2">Shortcode Usage</h4>
                    <div className="text-sm text-purple-700 space-y-1">
                      <div><code>[chatbot_builder]</code> - Default widget</div>
                      <div><code>[chatbot_builder title="Support"]</code> - Custom title</div>
                      <div><code>[chatbot_builder inline="true"]</code> - Inline widget</div>
                      <div><code>[chatbot_builder auto-open="true"]</code> - Auto-open</div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WordPress Plugin Code
                  </label>
                  <div className="relative">
                    <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto max-h-96">
                      <code>{generateWordPressCode()}</code>
                    </pre>
                    <button
                      onClick={() => navigator.clipboard.writeText(generateWordPressCode())}
                      className="absolute top-2 right-2 px-3 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-600"
                    >
                      Copy Code
                    </button>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-yellow-800 mb-2">Installation Instructions</h4>
                  <ol className="text-sm text-yellow-700 space-y-1">
                    <li>1. Save the code above as <code>chatbot-builder.php</code></li>
                    <li>2. Upload to your <code>/wp-content/plugins/chatbot-builder/</code> directory</li>
                    <li>3. Activate the plugin in WordPress admin</li>
                    <li>4. Configure settings under Settings → ChatBot Builder</li>
                    <li>5. Use shortcodes in posts/pages or let it auto-load</li>
                  </ol>
                </div>
              </div>
            </div>
          </Tab.Panel>

          {/* REST API */}
          <Tab.Panel>
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">REST API Integration</h3>
              <p className="text-gray-600 mb-4">
                Use our REST API for custom integrations, mobile apps, or server-to-server communication.
              </p>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-800 mb-2">API Information</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div><strong>Base URL:</strong></div>
                      <div className="font-mono text-xs bg-white p-1 rounded">{process.env.NEXT_PUBLIC_API_URL || 'https://your-domain.com/api'}</div>
                      <div><strong>API Key:</strong></div>
                      <div className="font-mono text-xs bg-white p-1 rounded">{chatbot.integration?.apiKey || 'your-api-key'}</div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Rate Limits</h4>
                    <div className="text-sm text-blue-700 space-y-1">
                      <div>Public: {integration.rateLimiting.requestsPerMinute}/min</div>
                      <div>Authenticated: {integration.rateLimiting.requestsPerHour}/hour</div>
                      <div>Burst: 10 requests/second</div>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-green-800 mb-2">Features</h4>
                    <div className="text-sm text-green-700 space-y-1">
                      <div>• RESTful endpoints</div>
                      <div>• JSON responses</div>
                      <div>• Webhook support</div>
                      <div>• Real-time events</div>
                      <div>• SDK libraries</div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Documentation
                  </label>
                  <div className="relative">
                    <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto max-h-96">
                      <code>{generateAPIDocumentation()}</code>
                    </pre>
                    <button
                      onClick={() => navigator.clipboard.writeText(generateAPIDocumentation())}
                      className="absolute top-2 right-2 px-3 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-600"
                    >
                      Copy Docs
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <button
                      onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'https://your-domain.com/api'}/docs`, '_blank')}
                      className="w-full inline-flex items-center justify-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      Interactive API Docs
                    </button>
                  </div>
                  <div>
                    <button
                      onClick={() => window.open('/api-playground', '_blank')}
                      className="w-full inline-flex items-center justify-center px-4 py-2 border border-green-300 rounded-md shadow-sm text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6 4h6M7 7h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2z" />
                      </svg>
                      API Playground
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Tab.Panel>

          {/* Settings */}
          <Tab.Panel>
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
                    Use this API key for authenticated requests
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
                    {integration.domains.map((domain: any, index: any) => (
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
                    Receive real-time notifications for conversations and events
                  </p>
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
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}