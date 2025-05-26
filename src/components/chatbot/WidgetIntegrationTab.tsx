// components/chatbot/WidgetIntegrationTab.tsx
'use client';

import { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import { EmbedCodeGenerator } from '@/components/EmbedCodeGenerator';

interface WidgetIntegrationTabProps {
  chatbot: any;
  onUpdate: (updates: any) => Promise<boolean>;
  saving: boolean;
}

export default function WidgetIntegrationTab({ chatbot, onUpdate, saving }: WidgetIntegrationTabProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [widgetSettings, setWidgetSettings] = useState({
    // Appearance
    theme: chatbot.styling?.theme || 'modern',
    primaryColor: chatbot.styling?.primaryColor || '#007bff',
    secondaryColor: chatbot.styling?.secondaryColor || '#6c757d',
    backgroundColor: chatbot.styling?.backgroundColor || '#ffffff',
    textColor: chatbot.styling?.textColor || '#333333',
    fontFamily: chatbot.styling?.fontFamily || 'Inter, sans-serif',
    fontSize: chatbot.styling?.fontSize || 14,
    borderRadius: chatbot.styling?.borderRadius || 12,
    shadowIntensity: chatbot.styling?.shadowIntensity || 'medium',
    
    // Size & Position
    position: chatbot.styling?.position || 'bottom-right',
    width: chatbot.styling?.width || 380,
    height: chatbot.styling?.height || 600,
    offsetX: chatbot.styling?.offsetX || 20,
    offsetY: chatbot.styling?.offsetY || 20,
    
    // Behavior
    autoOpen: chatbot.config?.autoOpen || false,
    openDelay: chatbot.config?.openDelay || 3000,
    showOnPages: chatbot.config?.showOnPages || 'all',
    pageRules: chatbot.config?.pageRules || [],
    triggerAfterScroll: chatbot.config?.triggerAfterScroll || false,
    scrollPercentage: chatbot.config?.scrollPercentage || 50,
    showUnreadBadge: chatbot.config?.showUnreadBadge || true,
    soundEnabled: chatbot.config?.soundEnabled || false,
    animationStyle: chatbot.styling?.animationStyle || 'bounce',
    
    // Advanced
    customCSS: chatbot.styling?.customCSS || '',
    customJS: chatbot.integration?.customJS || '',
    zIndex: chatbot.styling?.zIndex || 9999,
    mobileBreakpoint: chatbot.styling?.mobileBreakpoint || 768,
    hideOnMobile: chatbot.config?.hideOnMobile || false,
  });

  const tabs = [
    { id: 'appearance', name: 'Appearance', icon: '🎨' },
    { id: 'behavior', name: 'Behavior', icon: '⚙️' },
    { id: 'integration', name: 'Integration', icon: '🔗' },
    { id: 'advanced', name: 'Advanced', icon: '⚡' }
  ];

  const handleUpdate = async () => {
    const updates = {
      styling: {
        ...chatbot.styling,
        theme: widgetSettings.theme,
        primaryColor: widgetSettings.primaryColor,
        secondaryColor: widgetSettings.secondaryColor,
        backgroundColor: widgetSettings.backgroundColor,
        textColor: widgetSettings.textColor,
        fontFamily: widgetSettings.fontFamily,
        fontSize: widgetSettings.fontSize,
        borderRadius: widgetSettings.borderRadius,
        shadowIntensity: widgetSettings.shadowIntensity,
        position: widgetSettings.position,
        width: widgetSettings.width,
        height: widgetSettings.height,
        offsetX: widgetSettings.offsetX,
        offsetY: widgetSettings.offsetY,
        animationStyle: widgetSettings.animationStyle,
        customCSS: widgetSettings.customCSS,
        zIndex: widgetSettings.zIndex,
        mobileBreakpoint: widgetSettings.mobileBreakpoint,
      },
      config: {
        ...chatbot.config,
        autoOpen: widgetSettings.autoOpen,
        openDelay: widgetSettings.openDelay,
        showOnPages: widgetSettings.showOnPages,
        pageRules: widgetSettings.pageRules,
        triggerAfterScroll: widgetSettings.triggerAfterScroll,
        scrollPercentage: widgetSettings.scrollPercentage,
        showUnreadBadge: widgetSettings.showUnreadBadge,
        soundEnabled: widgetSettings.soundEnabled,
        hideOnMobile: widgetSettings.hideOnMobile,
      },
      integration: {
        ...chatbot.integration,
        customJS: widgetSettings.customJS,
      }
    };

    return await onUpdate(updates);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Widget Integration & Customization</h3>
        
        <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
          <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1 mb-6">
            {tabs.map((tab, index) => (
              <Tab
                key={tab.id}
                className={({ selected }) =>
                  `w-full rounded-lg py-2.5 text-sm font-medium leading-5 flex items-center justify-center space-x-2 ${
                    selected
                      ? 'bg-white text-blue-700 shadow'
                      : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'
                  }`
                }
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </Tab>
            ))}
          </Tab.List>

          <Tab.Panels>
            {/* Appearance Tab */}
            <Tab.Panel className="space-y-6">
              <AppearanceSettings 
                settings={widgetSettings} 
                onChange={setWidgetSettings}
                chatbot={chatbot}
              />
            </Tab.Panel>

            {/* Behavior Tab */}
            <Tab.Panel className="space-y-6">
              <BehaviorSettings 
                settings={widgetSettings} 
                onChange={setWidgetSettings} 
              />
            </Tab.Panel>

            {/* Integration Tab */}
            <Tab.Panel className="space-y-6">
              <IntegrationMethods chatbot={chatbot} settings={widgetSettings} />
            </Tab.Panel>

            {/* Advanced Tab */}
            <Tab.Panel className="space-y-6">
              <AdvancedSettings 
                settings={widgetSettings} 
                onChange={setWidgetSettings} 
              />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>

        <div className="flex justify-end mt-6 pt-6 border-t">
          <button
            onClick={handleUpdate}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Widget Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Appearance Settings Component
function AppearanceSettings({ settings, onChange, chatbot }: any) {
  const themes = [
    { id: 'modern', name: 'Modern', preview: '🔷' },
    { id: 'minimal', name: 'Minimal', preview: '⚪' },
    { id: 'rounded', name: 'Rounded', preview: '🔘' },
    { id: 'sharp', name: 'Sharp', preview: '⬜' },
    { id: 'bubble', name: 'Bubble', preview: '💭' },
  ];

  const fonts = [
    'Inter, sans-serif',
    'Roboto, sans-serif',
    'Open Sans, sans-serif',
    'Lato, sans-serif',
    'Poppins, sans-serif',
    'Nunito, sans-serif',
    'Montserrat, sans-serif',
    'system-ui, sans-serif'
  ];

  const positions = [
    { id: 'bottom-right', name: 'Bottom Right', icon: '↘️' },
    { id: 'bottom-left', name: 'Bottom Left', icon: '↙️' },
    { id: 'top-right', name: 'Top Right', icon: '↗️' },
    { id: 'top-left', name: 'Top Left', icon: '↖️' },
    { id: 'center-right', name: 'Center Right', icon: '➡️' },
    { id: 'center-left', name: 'Center Left', icon: '⬅️' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        {/* Theme Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Theme Style</label>
          <div className="grid grid-cols-3 gap-3">
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => onChange({ ...settings, theme: theme.id })}
                className={`p-3 rounded-lg border-2 transition-all ${
                  settings.theme === theme.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">{theme.preview}</div>
                <div className="text-xs font-medium">{theme.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Colors */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Colors</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={settings.primaryColor}
                  onChange={(e) => onChange({ ...settings, primaryColor: e.target.value })}
                  className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.primaryColor}
                  onChange={(e) => onChange({ ...settings, primaryColor: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={settings.backgroundColor}
                  onChange={(e) => onChange({ ...settings, backgroundColor: e.target.value })}
                  className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.backgroundColor}
                  onChange={(e) => onChange({ ...settings, backgroundColor: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Typography</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Font Family</label>
              <select
                value={settings.fontFamily}
                onChange={(e) => onChange({ ...settings, fontFamily: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {fonts.map((font) => (
                  <option key={font} value={font}>{font.split(',')[0]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Font Size</label>
              <input
                type="range"
                min="12"
                max="18"
                value={settings.fontSize}
                onChange={(e) => onChange({ ...settings, fontSize: parseInt(e.target.value) })}
                className="w-full"
              />
              <div className="text-sm text-gray-500 text-center">{settings.fontSize}px</div>
            </div>
          </div>
        </div>

        {/* Position */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Position</label>
          <div className="grid grid-cols-2 gap-3">
            {positions.map((position) => (
              <button
                key={position.id}
                onClick={() => onChange({ ...settings, position: position.id })}
                className={`p-3 rounded-lg border-2 transition-all flex items-center space-x-2 ${
                  settings.position === position.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span>{position.icon}</span>
                <span className="text-sm font-medium">{position.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Live Preview */}
      <div className="space-y-6">
        <h4 className="font-medium text-gray-900">Live Preview</h4>
        <WidgetPreview settings={settings} chatbot={chatbot} />
      </div>
    </div>
  );
}

// Behavior Settings Component
function BehaviorSettings({ settings, onChange }: any) {
  return (
    <div className="space-y-6">
      {/* Auto-Open Settings */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900">Auto-Open Behavior</h4>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autoOpen}
              onChange={(e) => onChange({ ...settings, autoOpen: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {settings.autoOpen && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delay (seconds): {settings.openDelay / 1000}
              </label>
              <input
                type="range"
                min="0"
                max="30000"
                step="1000"
                value={settings.openDelay}
                onChange={(e) => onChange({ ...settings, openDelay: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* Scroll Trigger */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900">Scroll Trigger</h4>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.triggerAfterScroll}
              onChange={(e) => onChange({ ...settings, triggerAfterScroll: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {settings.triggerAfterScroll && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Show after {settings.scrollPercentage}% scroll
            </label>
            <input
              type="range"
              min="10"
              max="90"
              value={settings.scrollPercentage}
              onChange={(e) => onChange({ ...settings, scrollPercentage: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
        )}
      </div>

      {/* Page Rules */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-4">Page Display Rules</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Show On</label>
            <select
              value={settings.showOnPages}
              onChange={(e) => onChange({ ...settings, showOnPages: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Pages</option>
              <option value="specific">Specific Pages</option>
              <option value="exclude">All Except Specific Pages</option>
            </select>
          </div>

          {settings.showOnPages !== 'all' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Page URLs (one per line)
              </label>
              <textarea
                rows={4}
                value={settings.pageRules.join('\n')}
                onChange={(e) => onChange({ ...settings, pageRules: e.target.value.split('\n').filter(Boolean) })}
                placeholder="/pricing&#10;/contact&#10;/product/*"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use * for wildcards. Examples: /pricing, /blog/*, /contact
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Additional Settings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">Show Unread Badge</h4>
            <p className="text-sm text-gray-500">Display notification count on chat button</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.showUnreadBadge}
              onChange={(e) => onChange({ ...settings, showUnreadBadge: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">Sound Notifications</h4>
            <p className="text-sm text-gray-500">Play sound for new messages</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.soundEnabled}
              onChange={(e) => onChange({ ...settings, soundEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">Hide on Mobile</h4>
            <p className="text-sm text-gray-500">Don't show widget on mobile devices</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.hideOnMobile}
              onChange={(e) => onChange({ ...settings, hideOnMobile: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>
  );
}

// Integration Methods Component
function IntegrationMethods({ chatbot, settings }: any) {
  const [activeMethod, setActiveMethod] = useState('javascript');

  const methods = [
    { id: 'javascript', name: 'JavaScript', icon: '🌐' },
    { id: 'react', name: 'React', icon: '⚛️' },
    { id: 'wordpress', name: 'WordPress', icon: '📝' },
    { id: 'api', name: 'REST API', icon: '🔌' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex space-x-4 border-b">
        {methods.map((method) => (
          <button
            key={method.id}
            onClick={() => setActiveMethod(method.id)}
            className={`pb-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
              activeMethod === method.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>{method.icon}</span>
            <span>{method.name}</span>
          </button>
        ))}
      </div>

      {activeMethod === 'javascript' && (
        <JavaScriptIntegration chatbot={chatbot} settings={settings} />
      )}
      
      {activeMethod === 'react' && (
        <ReactIntegration chatbot={chatbot} settings={settings} />
      )}
      
      {activeMethod === 'wordpress' && (
        <WordPressIntegration chatbot={chatbot} settings={settings} />
      )}
      
      {activeMethod === 'api' && (
        <APIIntegration chatbot={chatbot} />
      )}
    </div>
  );
}

// Widget Preview Component
function WidgetPreview({ settings, chatbot }: any) {
  const getPositionClasses = () => {
    switch (settings.position) {
      case 'bottom-left': return 'bottom-4 left-4';
      case 'top-right': return 'top-4 right-4';
      case 'top-left': return 'top-4 left-4';
      case 'center-right': return 'top-1/2 right-4 transform -translate-y-1/2';
      case 'center-left': return 'top-1/2 left-4 transform -translate-y-1/2';
      default: return 'bottom-4 right-4';
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 min-h-96 relative overflow-hidden">
      <div className="text-center text-gray-500 text-sm mb-4">
        Preview (scaled 70%)
      </div>
      
      {/* Simulated widget */}
      <div
        className={`absolute ${getPositionClasses()} transition-all duration-300`}
        style={{ transform: 'scale(0.7)', transformOrigin: settings.position.includes('top') ? 'top' : 'bottom' }}
      >
        {/* Chat Button */}
        <div
          className="w-16 h-16 rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
          style={{
            backgroundColor: settings.primaryColor,
            borderRadius: settings.theme === 'sharp' ? '12px' : '50%'
          }}
        >
          <span className="text-white text-2xl">💬</span>
          
          {settings.showUnreadBadge && (
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
              3
            </div>
          )}
        </div>

        {/* Sample Chat Window */}
        <div
          className="absolute bottom-20 right-0 bg-white border border-gray-200 overflow-hidden flex flex-col shadow-xl"
          style={{
            width: `${settings.width * 0.7}px`,
            height: `${settings.height * 0.7}px`,
            backgroundColor: settings.backgroundColor,
            borderRadius: `${settings.borderRadius}px`,
            fontFamily: settings.fontFamily,
            fontSize: `${settings.fontSize * 0.8}px`,
            boxShadow: settings.shadowIntensity === 'high' ? '0 25px 50px rgba(0,0,0,0.25)' :
                       settings.shadowIntensity === 'medium' ? '0 10px 25px rgba(0,0,0,0.15)' :
                       '0 5px 15px rgba(0,0,0,0.1)'
          }}
        >
          {/* Header */}
          <div
            className="p-4 text-white flex items-center justify-between flex-shrink-0"
            style={{ backgroundColor: settings.primaryColor }}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                🤖
              </div>
              <div>
                <div className="font-semibold">{chatbot.name}</div>
                <div className="text-xs opacity-90">Online</div>
              </div>
            </div>
            <button className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded">
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 space-y-3 bg-gray-50 overflow-hidden">
            <div className="bg-white p-3 rounded-lg shadow-sm max-w-[80%]">
              <div className="text-sm">{chatbot.config?.greeting || 'Hello! How can I help you?'}</div>
            </div>
            <div 
              className="text-white p-3 rounded-lg ml-auto max-w-[80%] text-right"
              style={{ backgroundColor: settings.primaryColor }}
            >
              <div className="text-sm">Hi there! I need some help.</div>
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t flex items-center space-x-2 flex-shrink-0">
            <div className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm">
              Type your message...
            </div>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white cursor-pointer"
              style={{ backgroundColor: settings.primaryColor }}
            >
              →
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// JavaScript Integration Component
function JavaScriptIntegration({ chatbot, settings }: any) {
  const generateEmbedCode = (customSettings = {}) => {
    const config = { ...settings, ...customSettings };
    const baseUrl = process.env.NEXT_PUBLIC_WIDGET_URL || 'https://your-domain.com';
    
    return `<!-- ChatBot Builder Widget -->
<script>
  (function() {
    var chatbotConfig = {
      chatbotId: '${chatbot._id}',
      apiUrl: '${baseUrl}/api',
      
      // Appearance
      theme: '${config.theme}',
      primaryColor: '${config.primaryColor}',
      backgroundColor: '${config.backgroundColor}',
      textColor: '${config.textColor}',
      fontFamily: '${config.fontFamily}',
      fontSize: ${config.fontSize},
      borderRadius: ${config.borderRadius},
      
      // Position & Size
      position: '${config.position}',
      width: ${config.width},
      height: ${config.height},
      offsetX: ${config.offsetX},
      offsetY: ${config.offsetY},
      
      // Behavior
      autoOpen: ${config.autoOpen},
      openDelay: ${config.openDelay},
      showUnreadBadge: ${config.showUnreadBadge},
      soundEnabled: ${config.soundEnabled},
      hideOnMobile: ${config.hideOnMobile},
      
      // Page Rules
      showOnPages: '${config.showOnPages}',
      pageRules: ${JSON.stringify(config.pageRules)},
      
      // Scroll Trigger
      triggerAfterScroll: ${config.triggerAfterScroll},
      scrollPercentage: ${config.scrollPercentage},
      
      // Content
      title: '${chatbot.name}',
      greeting: '${chatbot.config?.greeting || 'Hello! How can I help you?'}',
      placeholder: 'Type your message...',
      
      // Advanced
      zIndex: ${config.zIndex},
      customCSS: \`${config.customCSS}\`
    };

    // Load widget script
    var script = document.createElement('script');
    script.src = '${baseUrl}/widget/chat-widget.js';
    script.async = true;
    script.onload = function() {
      if (window.ChatBotBuilder) {
        window.chatbotInstance = new window.ChatBotBuilder(chatbotConfig);
      }
    };
    document.head.appendChild(script);

    // Custom JavaScript
    ${config.customJS || ''}
  })();
</script>`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Standard Embed Code</h4>
        <p className="text-sm text-gray-600 mb-4">
          Copy and paste this code before the closing &lt;/body&gt; tag on your website.
        </p>
        <CodeBlock code={generateEmbedCode()} language="html" />
      </div>

      <div>
        <h4 className="font-medium text-gray-900 mb-3">Advanced Options</h4>
        <div className="space-y-4">
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">With Custom Triggers</h5>
            <CodeBlock 
              code={generateEmbedCode() + `
<!-- Custom Trigger Examples -->
<script>
  // Open chatbot when button is clicked
  document.getElementById('help-button').addEventListener('click', function() {
    if (window.chatbotInstance) {
      window.chatbotInstance.open();
    }
  });

  // Send predefined message
  function askAboutPricing() {
    if (window.chatbotInstance) {
      window.chatbotInstance.sendMessage('I want to know about your pricing');
    }
  }

  // Listen to chatbot events
  window.addEventListener('chatbot-ready', function() {
    console.log('Chatbot is ready!');
  });
  
  window.addEventListener('chatbot-message-sent', function(event) {
    console.log('Message sent:', event.detail);
  });
</script>`} 
              language="html" 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// React Integration Component
function ReactIntegration({ chatbot, settings }: any) {
  const reactCode = `import React, { useEffect, useRef } from 'react';

interface ChatBotWidgetProps {
  chatbotId?: string;
  onMessage?: (message: string) => void;
  onReady?: () => void;
  customSettings?: Partial<ChatBotConfig>;
}

interface ChatBotConfig {
  chatbotId: string;
  apiUrl: string;
  theme: string;
  primaryColor: string;
  backgroundColor: string;
  position: string;
  width: number;
  height: number;
  autoOpen: boolean;
  openDelay: number;
  showUnreadBadge: boolean;
  title: string;
  greeting: string;
}

export const ChatBotWidget: React.FC<ChatBotWidgetProps> = ({
  chatbotId = '${chatbot._id}',
  onMessage,
  onReady,
  customSettings = {}
}) => {
  const widgetRef = useRef<any>(null);

  useEffect(() => {
    const config: ChatBotConfig = {
      chatbotId,
      apiUrl: '${process.env.NEXT_PUBLIC_WIDGET_URL || 'https://your-domain.com'}/api',
      
      // Default settings
      theme: '${settings.theme}',
      primaryColor: '${settings.primaryColor}',
      backgroundColor: '${settings.backgroundColor}',
      position: '${settings.position}',
      width: ${settings.width},
      height: ${settings.height},
      autoOpen: ${settings.autoOpen},
      openDelay: ${settings.openDelay},
      showUnreadBadge: ${settings.showUnreadBadge},
      title: '${chatbot.name}',
      greeting: '${chatbot.config?.greeting || 'Hello! How can I help you?'}',
      
      // Merge custom settings
      ...customSettings
    };

    // Load the widget script
    const loadWidget = async () => {
      if (!window.ChatBotBuilder) {
        const script = document.createElement('script');
        script.src = '${process.env.NEXT_PUBLIC_WIDGET_URL || 'https://your-domain.com'}/widget/chat-widget.js';
        script.async = true;
        
        script.onload = () => {
          initializeWidget(config);
        };
        
        document.head.appendChild(script);
      } else {
        initializeWidget(config);
      }
    };

    const initializeWidget = (config: ChatBotConfig) => {
      widgetRef.current = new window.ChatBotBuilder(config);
      
      // Set up event listeners
      if (onReady) {
        onReady();
      }
      
      if (onMessage) {
        window.addEventListener('chatbot-message-sent', (event: any) => {
          onMessage(event.detail.message);
        });
      }
    };

    loadWidget();

    // Cleanup
    return () => {
      if (widgetRef.current && widgetRef.current.destroy) {
        widgetRef.current.destroy();
      }
    };
  }, [chatbotId, onMessage, onReady, customSettings]);

  // Public methods
  const openChat = () => {
    if (widgetRef.current) {
      widgetRef.current.open();
    }
  };

  const closeChat = () => {
    if (widgetRef.current) {
      widgetRef.current.close();
    }
  };

  const sendMessage = (message: string) => {
    if (widgetRef.current) {
      widgetRef.current.sendBotMessage(message);
    }
  };

  // Expose widget methods
  React.useImperativeHandle(widgetRef, () => ({
    open: openChat,
    close: closeChat,
    sendMessage
  }));

  return null; // Widget renders itself
};

// Usage example:
export default function App() {
  const handleMessage = (message: string) => {
    console.log('User sent:', message);
  };

  const handleReady = () => {
    console.log('ChatBot is ready!');
  };

  return (
    <div>
      <h1>My Website</h1>
      <button onClick={() => window.chatbotInstance?.open()}>
        Open Chat
      </button>
      
      <ChatBotWidget
        onMessage={handleMessage}
        onReady={handleReady}
        customSettings={{
          autoOpen: false,
          primaryColor: '#ff6b6b'
        }}
      />
    </div>
  );
}`;

  const packageJson = `{
  "name": "@your-company/chatbot-widget",
  "version": "1.0.0",
  "description": "React component for ChatBot Builder widget",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "keywords": ["chatbot", "widget", "react", "customer-support"],
  "author": "Your Company",
  "license": "MIT",
  "peerDependencies": {
    "react": "^16.8.0 || ^17.0.0 || ^18.0.0",
    "react-dom": "^16.8.0 || ^17.0.0 || ^18.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "typescript": "^4.9.0"
  }
}`;

  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium text-gray-900 mb-3">React Component</h4>
        <p className="text-sm text-gray-600 mb-4">
          Use this React component in your React/Next.js applications.
        </p>
        <CodeBlock code={reactCode} language="tsx" />
      </div>

      <div>
        <h4 className="font-medium text-gray-900 mb-3">NPM Package</h4>
        <p className="text-sm text-gray-600 mb-4">
          Install as an npm package for easier integration.
        </p>
        
        <div className="space-y-4">
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">Installation</h5>
            <CodeBlock code="npm install @your-company/chatbot-widget" language="bash" />
          </div>

          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">Package.json</h5>
            <CodeBlock code={packageJson} language="json" />
          </div>

          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">Usage</h5>
            <CodeBlock code={`import { ChatBotWidget } from '@your-company/chatbot-widget';

function App() {
  return (
    <div>
      <ChatBotWidget 
        chatbotId="${chatbot._id}"
        customSettings={{
          primaryColor: '#your-brand-color',
          position: 'bottom-left'
        }}
      />
    </div>
  );
}`} language="tsx" />
          </div>
        </div>
      </div>
    </div>
  );
}

// WordPress Integration Component
function WordPressIntegration({ chatbot, settings }: any) {
  const pluginCode = `<?php
/**
 * Plugin Name: ChatBot Builder Widget
 * Plugin URI: https://your-domain.com
 * Description: Add ChatBot Builder widget to your WordPress site
 * Version: 1.0.0
 * Author: Your Company
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class ChatBotBuilderWidget {
    
    public function __construct() {
        add_action('init', array($this, 'init'));
        add_action('wp_footer', array($this, 'add_widget_script'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'settings_init'));
    }
    
    public function init() {
        // Plugin initialization
    }
    
    public function add_widget_script() {
        $options = get_option('chatbot_builder_settings');
        
        if (empty($options['chatbot_id'])) {
            return;
        }
        
        $config = array(
            'chatbotId' => sanitize_text_field($options['chatbot_id']),
            'apiUrl' => 'https://your-domain.com/api',
            'theme' => sanitize_text_field($options['theme'] ?? 'modern'),
            'primaryColor' => sanitize_hex_color($options['primary_color'] ?? '#007bff'),
            'position' => sanitize_text_field($options['position'] ?? 'bottom-right'),
            'autoOpen' => (bool) ($options['auto_open'] ?? false),
            'openDelay' => intval($options['open_delay'] ?? 3000),
            'showUnreadBadge' => (bool) ($options['show_unread_badge'] ?? true),
            'hideOnMobile' => (bool) ($options['hide_on_mobile'] ?? false),
        );
        
        // Check page rules
        if (!$this->should_show_on_current_page($options)) {
            return;
        }
        
        ?>
        <script>
        (function() {
            var config = <?php echo json_encode($config); ?>;
            var script = document.createElement('script');
            script.src = 'https://your-domain.com/widget/chat-widget.js';
            script.async = true;
            script.onload = function() {
                if (window.ChatBotBuilder) {
                    window.chatbotInstance = new window.ChatBotBuilder(config);
                }
            };
            document.head.appendChild(script);
        })();
        </script>
        <?php
    }
    
    private function should_show_on_current_page($options) {
        $show_on_pages = $options['show_on_pages'] ?? 'all';
        $page_rules = explode("\\n", $options['page_rules'] ?? '');
        $current_url = $_SERVER['REQUEST_URI'];
        
        if ($show_on_pages === 'all') {
            return true;
        }
        
        $matches = false;
        foreach ($page_rules as $rule) {
            $rule = trim($rule);
            if (empty($rule)) continue;
            
            if (strpos($rule, '*') !== false) {
                $pattern = str_replace('*', '.*', preg_quote($rule, '/'));
                if (preg_match('/^' . $pattern . '$/', $current_url)) {
                    $matches = true;
                    break;
                }
            } else {
                if ($current_url === $rule || strpos($current_url, $rule) === 0) {
                    $matches = true;
                    break;
                }
            }
        }
        
        return $show_on_pages === 'specific' ? $matches : !$matches;
    }
    
    public function add_admin_menu() {
        add_options_page(
            'ChatBot Builder Settings',
            'ChatBot Builder',
            'manage_options',
            'chatbot-builder',
            array($this, 'options_page')
        );
    }
    
    public function settings_init() {
        register_setting('chatbot_builder', 'chatbot_builder_settings');
        
        add_settings_section(
            'chatbot_builder_section',
            'ChatBot Configuration',
            null,
            'chatbot_builder'
        );
        
        // Add settings fields
        $fields = array(
            'chatbot_id' => 'Chatbot ID',
            'theme' => 'Theme',
            'primary_color' => 'Primary Color',
            'position' => 'Position',
            'auto_open' => 'Auto Open',
            'open_delay' => 'Open Delay (ms)',
            'show_unread_badge' => 'Show Unread Badge',
            'hide_on_mobile' => 'Hide on Mobile',
            'show_on_pages' => 'Show On Pages',
            'page_rules' => 'Page Rules'
        );
        
        foreach ($fields as $field => $label) {
            add_settings_field(
                $field,
                $label,
                array($this, 'field_callback'),
                'chatbot_builder',
                'chatbot_builder_section',
                array('field' => $field, 'label' => $label)
            );
        }
    }
    
    public function field_callback($args) {
        $options = get_option('chatbot_builder_settings');
        $field = $args['field'];
        $value = $options[$field] ?? '';
        
        switch ($field) {
            case 'auto_open':
            case 'show_unread_badge':
            case 'hide_on_mobile':
                echo '<input type="checkbox" name="chatbot_builder_settings[' . $field . ']" value="1" ' . checked(1, $value, false) . ' />';
                break;
            case 'theme':
                $themes = array('modern' => 'Modern', 'minimal' => 'Minimal', 'rounded' => 'Rounded');
                echo '<select name="chatbot_builder_settings[' . $field . ']">';
                foreach ($themes as $key => $label) {
                    echo '<option value="' . $key . '" ' . selected($value, $key, false) . '>' . $label . '</option>';
                }
                echo '</select>';
                break;
            case 'position':
                $positions = array(
                    'bottom-right' => 'Bottom Right',
                    'bottom-left' => 'Bottom Left',
                    'top-right' => 'Top Right',
                    'top-left' => 'Top Left'
                );
                echo '<select name="chatbot_builder_settings[' . $field . ']">';
                foreach ($positions as $key => $label) {
                    echo '<option value="' . $key . '" ' . selected($value, $key, false) . '>' . $label . '</option>';
                }
                echo '</select>';
                break;
            case 'show_on_pages':
                $options_list = array('all' => 'All Pages', 'specific' => 'Specific Pages', 'exclude' => 'Exclude Pages');
                echo '<select name="chatbot_builder_settings[' . $field . ']">';
                foreach ($options_list as $key => $label) {
                    echo '<option value="' . $key . '" ' . selected($value, $key, false) . '>' . $label . '</option>';
                }
                echo '</select>';
                break;
            case 'page_rules':
                echo '<textarea name="chatbot_builder_settings[' . $field . ']" rows="5" cols="50" placeholder="One URL per line, e.g. /contact or /blog/*">' . esc_textarea($value) . '</textarea>';
                break;
            case 'primary_color':
                echo '<input type="color" name="chatbot_builder_settings[' . $field . ']" value="' . esc_attr($value) . '" />';
                break;
            default:
                echo '<input type="text" name="chatbot_builder_settings[' . $field . ']" value="' . esc_attr($value) . '" />';
        }
    }
    
    public function options_page() {
        ?>
        <div class="wrap">
            <h1>ChatBot Builder Settings</h1>
            <form action="options.php" method="post">
                <?php
                settings_fields('chatbot_builder');
                do_settings_sections('chatbot_builder');
                submit_button();
                ?>
            </form>
        </div>
        <?php
    }
}

new ChatBotBuilderWidget();
?>`;

  const shortcodeCode = `// Add shortcode support
add_shortcode('chatbot_button', 'chatbot_button_shortcode');

function chatbot_button_shortcode($atts) {
    $atts = shortcode_atts(array(
        'text' => 'Open Chat',
        'class' => 'chatbot-trigger-btn',
        'message' => ''
    ), $atts);
    
    $onclick = $atts['message'] ? 
        "window.chatbotInstance && window.chatbotInstance.sendMessage('{$atts['message']}')" :
        "window.chatbotInstance && window.chatbotInstance.open()";
    
    return '<button class="' . esc_attr($atts['class']) . '" onclick="' . $onclick . '">' . 
           esc_html($atts['text']) . '</button>';
}

// Usage in posts/pages:
// [chatbot_button text="Need Help?" message="I need help with my order"]`;

  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium text-gray-900 mb-3">WordPress Plugin</h4>
        <p className="text-sm text-gray-600 mb-4">
          Complete WordPress plugin with admin settings page.
        </p>
        <CodeBlock code={pluginCode} language="php" />
      </div>

      <div>
        <h4 className="font-medium text-gray-900 mb-3">Shortcode Support</h4>
        <p className="text-sm text-gray-600 mb-4">
          Add buttons and triggers anywhere in your content.
        </p>
        <CodeBlock code={shortcodeCode} language="php" />
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Installation Instructions</h4>
        <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
          <li>Download the plugin files</li>
          <li>Upload to /wp-content/plugins/chatbot-builder/</li>
          <li>Activate the plugin in WordPress admin</li>
          <li>Go to Settings → ChatBot Builder</li>
          <li>Enter your Chatbot ID: <code className="bg-blue-100 px-1 rounded">{chatbot._id}</code></li>
          <li>Configure appearance and behavior settings</li>
          <li>Save settings and test on your site</li>
        </ol>
      </div>
    </div>
  );
}

// API Integration Component
function APIIntegration({ chatbot }: any) {
  const apiExamples = {
    sendMessage: `// Send a message to the chatbot
const response = await fetch('/api/conversations/message', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ${chatbot.integration?.apiKey || 'your-api-key'}'
  },
  body: JSON.stringify({
    chatbotId: '${chatbot._id}',
    sessionId: 'unique-session-id',
    message: 'Hello, I need help!',
    visitorInfo: {
      userAgent: navigator.userAgent,
      url: window.location.href,
      referrer: document.referrer
    }
  })
});

const data = await response.json();
console.log('Bot response:', data.message.content);`,

    getAnalytics: `// Get chatbot analytics
const analytics = await fetch('/api/chatbots/${chatbot._id}/analytics?period=30', {
  headers: {
    'Authorization': 'Bearer ${chatbot.integration?.apiKey || 'your-api-key'}'
  }
});

const data = await analytics.json();
console.log('Analytics:', data.analytics);`,

    webhook: `// Webhook payload example
{
  "event": "message_received",
  "chatbotId": "${chatbot._id}",
  "conversationId": "conv_12345",
  "sessionId": "session_12345",
  "message": {
    "id": "msg_12345",
    "type": "user",
    "content": "Hello!",
    "timestamp": "2024-01-20T10:30:00Z"
  },
  "response": {
    "id": "msg_12346",
    "type": "bot", 
    "content": "Hi there! How can I help you?",
    "timestamp": "2024-01-20T10:30:01Z"
  },
  "visitorInfo": {
    "ip": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "url": "https://example.com/contact"
  }
}`,

    customIntegration: `// Custom integration example (Node.js)
const express = require('express');
const app = express();

// Middleware to handle chatbot integration
app.use('/chatbot', async (req, res) => {
  const { action, data } = req.body;
  
  switch (action) {
    case 'send_message':
      const response = await sendToChatBot(data.message, data.sessionId);
      res.json({ success: true, response });
      break;
      
    case 'get_conversations':
      const conversations = await getChatBotConversations(data.chatbotId);
      res.json({ success: true, conversations });
      break;
      
    default:
      res.status(400).json({ error: 'Unknown action' });
  }
});

async function sendToChatBot(message, sessionId) {
  return await fetch('https://your-domain.com/api/conversations/message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ${chatbot.integration?.apiKey || 'your-api-key'}'
    },
    body: JSON.stringify({
      chatbotId: '${chatbot._id}',
      sessionId,
      message
    })
  }).then(res => res.json());
}`
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Send Message API</h4>
        <p className="text-sm text-gray-600 mb-4">
          Send messages directly to your chatbot via REST API.
        </p>
        <CodeBlock code={apiExamples.sendMessage} language="javascript" />
      </div>

      <div>
        <h4 className="font-medium text-gray-900 mb-3">Analytics API</h4>
        <p className="text-sm text-gray-600 mb-4">
          Retrieve chatbot analytics and conversation data.
        </p>
        <CodeBlock code={apiExamples.getAnalytics} language="javascript" />
      </div>

      <div>
        <h4 className="font-medium text-gray-900 mb-3">Webhook Integration</h4>
        <p className="text-sm text-gray-600 mb-4">
          Receive real-time notifications when events occur.
        </p>
        <CodeBlock code={apiExamples.webhook} language="json" />
      </div>

      <div>
        <h4 className="font-medium text-gray-900 mb-3">Custom Integration</h4>
        <p className="text-sm text-gray-600 mb-4">
          Build custom integrations with your existing systems.
        </p>
        <CodeBlock code={apiExamples.customIntegration} language="javascript" />
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">API Documentation</h4>
        <div className="space-y-2 text-sm">
          <div><strong>Base URL:</strong> <code>https://your-domain.com/api</code></div>
          <div><strong>Authentication:</strong> Bearer token in Authorization header</div>
          <div><strong>API Key:</strong> <code className="bg-gray-200 px-2 py-1 rounded">{chatbot.integration?.apiKey || 'your-api-key'}</code></div>
          <div><strong>Rate Limits:</strong> {chatbot.integration?.rateLimiting?.requestsPerMinute || 60} requests/minute</div>
        </div>
      </div>
    </div>
  );
}

// Advanced Settings Component
function AdvancedSettings({ settings, onChange }: any) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Custom CSS</label>
        <textarea
          value={settings.customCSS}
          onChange={(e) => onChange({ ...settings, customCSS: e.target.value })}
          rows={8}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          placeholder={`.chatbot-widget {
  /* Custom styles */
}

.chatbot-message.bot .chatbot-message-content {
  background: linear-gradient(45deg, #007bff, #0056b3);
}`}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Custom JavaScript</label>
        <textarea
          value={settings.customJS}
          onChange={(e) => onChange({ ...settings, customJS: e.target.value })}
          rows={8}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          placeholder={`// Custom JavaScript code
window.addEventListener('chatbot-ready', function() {
  console.log('Chatbot loaded!');
});

// Track events
window.addEventListener('chatbot-message-sent', function(event) {
  gtag('event', 'chatbot_message', {
    'event_category': 'engagement',
    'event_label': event.detail.message
  });
});`}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Z-Index</label>
          <input
            type="number"
            min="1000"
            max="99999"
            value={settings.zIndex}
            onChange={(e) => onChange({ ...settings, zIndex: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Breakpoint (px)</label>
          <input
            type="number"
            min="320"
            max="1024"
            value={settings.mobileBreakpoint}
            onChange={(e) => onChange({ ...settings, mobileBreakpoint: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-