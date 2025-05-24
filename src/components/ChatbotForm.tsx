// components/ChatbotForm.tsx - Complete Create/Edit Form
'use client';

import { useState } from 'react';
import { Tab } from '@headlessui/react';

interface ChatbotFormProps {
    initialData?: any;
    onSubmit: (data: any) => Promise<void>;
    loading?: boolean;
    submitText?: string;
}

export default function ChatbotForm({
    initialData,
    onSubmit,
    loading = false,
    submitText = 'Save Changes'
}: ChatbotFormProps) {
    const [formData, setFormData] = useState({
        // Basic Info
        name: initialData?.name || '',
        description: initialData?.description || '',
        avatar: initialData?.avatar || '',

        // Configuration
        config: {
            greeting: initialData?.config?.greeting || 'Hello! How can I help you today?',
            fallbackMessage: initialData?.config?.fallbackMessage || 'I\'m sorry, I didn\'t understand that. Could you please rephrase?',
            collectEmail: initialData?.config?.collectEmail || false,
            collectPhone: initialData?.config?.collectPhone || false,
            allowFileUpload: initialData?.config?.allowFileUpload || false,
            maxFileSize: initialData?.config?.maxFileSize || 5,
            allowedFileTypes: initialData?.config?.allowedFileTypes || ['jpg', 'png', 'pdf'],
            businessHours: initialData?.config?.businessHours || {
                enabled: false,
                timezone: 'UTC',
                schedule: [],
                outsideHoursMessage: 'Thanks for your message! We\'ll get back to you during business hours.'
            },
            language: initialData?.config?.language || 'en',
            responseDelay: initialData?.config?.responseDelay || 1000
        },

        // Styling
        styling: {
            primaryColor: initialData?.styling?.primaryColor || '#007bff',
            secondaryColor: initialData?.styling?.secondaryColor || '#6c757d',
            backgroundColor: initialData?.styling?.backgroundColor || '#ffffff',
            textColor: initialData?.styling?.textColor || '#333333',
            fontFamily: initialData?.styling?.fontFamily || 'Inter, sans-serif',
            fontSize: initialData?.styling?.fontSize || 14,
            borderRadius: initialData?.styling?.borderRadius || 8,
            position: initialData?.styling?.position || 'bottom-right',
            width: initialData?.styling?.width || 350,
            height: initialData?.styling?.height || 500,
            buttonStyle: initialData?.styling?.buttonStyle || 'round',
            shadowEnabled: initialData?.styling?.shadowEnabled !== false,
            animationEnabled: initialData?.styling?.animationEnabled !== false
        },

        // Knowledge Base
        knowledgeBase: initialData?.knowledgeBase || [],

        // AI Settings
        ai: {
            enabled: initialData?.ai?.enabled || false,
            provider: initialData?.ai?.provider || 'openai',
            model: initialData?.ai?.model || 'gpt-3.5-turbo',
            temperature: initialData?.ai?.temperature || 0.7,
            maxTokens: initialData?.ai?.maxTokens || 150,
            systemPrompt: initialData?.ai?.systemPrompt || 'You are a helpful customer support assistant.',
            fallbackToRules: initialData?.ai?.fallbackToRules !== false
        }
    });

    const [activeTab, setActiveTab] = useState(0);
    const [errors, setErrors] = useState<any>({});
    const [newKbItem, setNewKbItem] = useState({
        question: '',
        answer: '',
        keywords: '',
        category: ''
    });

    const updateFormData = (section: string, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section as keyof typeof prev],
                [field]: value
            }
        }));
    };

    const validateForm = () => {
        const newErrors: any = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Chatbot name is required';
        }

        if (formData.config.greeting.length < 5) {
            newErrors.greeting = 'Greeting message must be at least 5 characters';
        }

        if (formData.config.responseDelay < 0 || formData.config.responseDelay > 10000) {
            newErrors.responseDelay = 'Response delay must be between 0 and 10000ms';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        await onSubmit(formData);
    };

    const addKnowledgeBaseItem = () => {
        if (!newKbItem.question.trim() || !newKbItem.answer.trim()) return;

        const kbItem = {
            id: `kb_${Date.now()}`,
            question: newKbItem.question.trim(),
            answer: newKbItem.answer.trim(),
            keywords: newKbItem.keywords.split(',').map(k => k.trim()).filter(k => k),
            category: newKbItem.category.trim() || 'General',
            isActive: true,
            confidence: 1.0,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        setFormData(prev => ({
            ...prev,
            knowledgeBase: [...prev.knowledgeBase, kbItem]
        }));

        setNewKbItem({ question: '', answer: '', keywords: '', category: '' });
    };

    const removeKnowledgeBaseItem = (id: string) => {
        setFormData(prev => ({
            ...prev,
            knowledgeBase: prev.knowledgeBase.filter((item: any) => item.id !== id)
        }));
    };

    const tabs = [
        { name: 'Basic Info', id: 'basic' },
        { name: 'Responses', id: 'responses' },
        { name: 'Styling', id: 'styling' },
        { name: 'AI Settings', id: 'ai' }
    ];

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
                <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1">
                    {tabs.map((tab) => (
                        <Tab
                            key={tab.id}
                            className={({ selected }) =>
                                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 ${selected
                                    ? 'bg-white text-blue-700 shadow'
                                    : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'
                                }`
                            }
                        >
                            {tab.name}
                        </Tab>
                    ))}
                </Tab.List>

                <Tab.Panels className="mt-8">
                    {/* Basic Info Tab */}
                    <Tab.Panel className="space-y-6">
                        <div className="bg-white shadow rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Chatbot Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="e.g., Customer Support Bot"
                                    />
                                    {errors.name && (
                                        <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Avatar URL
                                    </label>
                                    <div className="flex items-center space-x-4">
                                        <input
                                            type="url"
                                            value={formData.avatar}
                                            onChange={(e) => setFormData(prev => ({ ...prev, avatar: e.target.value }))}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="https://example.com/avatar.png"
                                        />
                                        {formData.avatar && (
                                            <img
                                                src={formData.avatar}
                                                alt="Avatar preview"
                                                className="w-10 h-10 rounded-full border border-gray-200"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                }}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Describe what this chatbot does..."
                                />
                            </div>
                        </div>
                    </Tab.Panel>

                    {/* Responses Tab */}
                    <Tab.Panel className="space-y-6">
                        <div className="bg-white shadow rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Response Configuration</h3>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Greeting Message *
                                    </label>
                                    <textarea
                                        value={formData.config.greeting}
                                        onChange={(e) => updateFormData('config', 'greeting', e.target.value)}
                                        rows={2}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.greeting ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="Hello! How can I help you today?"
                                    />
                                    {errors.greeting && (
                                        <p className="mt-1 text-sm text-red-600">{errors.greeting}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Fallback Message
                                    </label>
                                    <textarea
                                        value={formData.config.fallbackMessage}
                                        onChange={(e) => updateFormData('config', 'fallbackMessage', e.target.value)}
                                        rows={2}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="I'm sorry, I didn't understand that..."
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Response Delay (ms)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="10000"
                                            value={formData.config.responseDelay}
                                            onChange={(e) => updateFormData('config', 'responseDelay', parseInt(e.target.value) || 0)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        {errors.responseDelay && (
                                            <p className="mt-1 text-sm text-red-600">{errors.responseDelay}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Language
                                        </label>
                                        <select
                                            value={formData.config.language}
                                            onChange={(e) => updateFormData('config', 'language', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="en">English</option>
                                            <option value="es">Spanish</option>
                                            <option value="fr">French</option>
                                            <option value="de">German</option>
                                            <option value="hi">Hindi</option>
                                            <option value="pt">Portuguese</option>
                                            <option value="it">Italian</option>
                                            <option value="ja">Japanese</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Data Collection Settings */}
                                <div className="space-y-4">
                                    <h4 className="text-md font-medium text-gray-900">Data Collection</h4>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="collectEmail"
                                                checked={formData.config.collectEmail}
                                                onChange={(e) => updateFormData('config', 'collectEmail', e.target.checked)}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor="collectEmail" className="ml-2 block text-sm text-gray-900">
                                                Collect visitor email addresses
                                            </label>
                                        </div>

                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="collectPhone"
                                                checked={formData.config.collectPhone}
                                                onChange={(e) => updateFormData('config', 'collectPhone', e.target.checked)}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor="collectPhone" className="ml-2 block text-sm text-gray-900">
                                                Collect visitor phone numbers
                                            </label>
                                        </div>
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="allowFileUpload"
                                            checked={formData.config.allowFileUpload}
                                            onChange={(e) => updateFormData('config', 'allowFileUpload', e.target.checked)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="allowFileUpload" className="ml-2 block text-sm text-gray-900">
                                            Allow file uploads
                                        </label>
                                    </div>

                                    {formData.config.allowFileUpload && (
                                        <div className="ml-6 space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Max File Size (MB)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="50"
                                                        value={formData.config.maxFileSize}
                                                        onChange={(e) => updateFormData('config', 'maxFileSize', parseInt(e.target.value) || 5)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Allowed File Types
                                                    </label>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {['jpg', 'png', 'gif', 'pdf', 'doc', 'docx', 'txt', 'csv', 'xlsx'].map(type => (
                                                            <label key={type} className="flex items-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={formData.config.allowedFileTypes.includes(type)}
                                                                    onChange={(e) => {
                                                                        const types = e.target.checked
                                                                            ? [...formData.config.allowedFileTypes, type]
                                                                            : formData.config.allowedFileTypes.filter((t: string) => t !== type);
                                                                        updateFormData('config', 'allowedFileTypes', types);
                                                                    }}
                                                                    className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                                />
                                                                <span className="ml-1 text-xs text-gray-700">{type}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Knowledge Base Section */}
                                <div className="space-y-4">
                                    <h4 className="text-md font-medium text-gray-900">Knowledge Base</h4>

                                    {/* Add new KB item form */}
                                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <h5 className="text-sm font-medium text-gray-900 mb-3">Add FAQ Item</h5>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <input
                                                    type="text"
                                                    value={newKbItem.question}
                                                    onChange={(e) => setNewKbItem(prev => ({ ...prev, question: e.target.value }))}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                    placeholder="Question"
                                                />
                                            </div>
                                            <div>
                                                <input
                                                    type="text"
                                                    value={newKbItem.category}
                                                    onChange={(e) => setNewKbItem(prev => ({ ...prev, category: e.target.value }))}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                    placeholder="Category (optional)"
                                                />
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <textarea
                                                value={newKbItem.answer}
                                                onChange={(e) => setNewKbItem(prev => ({ ...prev, answer: e.target.value }))}
                                                rows={2}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                placeholder="Answer"
                                            />
                                        </div>

                                        <div className="flex items-center space-x-4">
                                            <input
                                                type="text"
                                                value={newKbItem.keywords}
                                                onChange={(e) => setNewKbItem(prev => ({ ...prev, keywords: e.target.value }))}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                placeholder="Keywords (comma-separated)"
                                            />
                                            <button
                                                type="button"
                                                onClick={addKnowledgeBaseItem}
                                                disabled={!newKbItem.question.trim() || !newKbItem.answer.trim()}
                                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>

                                    {/* Display existing KB items */}
                                    <div className="space-y-2">
                                        {formData.knowledgeBase.map((item: any) => (
                                            <div key={item.id} className="flex items-start justify-between p-3 bg-white border border-gray-200 rounded-lg">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <h6 className="text-sm font-medium text-gray-900">{item.question}</h6>
                                                        {item.category && (
                                                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                                                {item.category}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-600 mb-1">{item.answer}</p>
                                                    {item.keywords && item.keywords.length > 0 && (
                                                        <div className="flex flex-wrap gap-1">
                                                            {item.keywords.map((keyword: string, idx: number) => (
                                                                <span key={idx} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                                                                    {keyword}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeKnowledgeBaseItem(item.id)}
                                                    className="ml-2 text-red-600 hover:text-red-800 text-sm"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))}
                                        {formData.knowledgeBase.length === 0 && (
                                            <p className="text-sm text-gray-500 text-center py-4">
                                                No FAQ items added yet. Add some to help your chatbot respond better.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Tab.Panel>

                    {/* Styling Tab */}
                    <Tab.Panel className="space-y-6">
                        <div className="bg-white shadow rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Visual Customization</h3>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-md font-medium text-gray-900 mb-4">Colors</h4>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Primary Color
                                                </label>
                                                <div className="flex items-center space-x-3">
                                                    <input
                                                        type="color"
                                                        value={formData.styling.primaryColor}
                                                        onChange={(e) => updateFormData('styling', 'primaryColor', e.target.value)}
                                                        className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={formData.styling.primaryColor}
                                                        onChange={(e) => updateFormData('styling', 'primaryColor', e.target.value)}
                                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Background Color
                                                </label>
                                                <div className="flex items-center space-x-3">
                                                    <input
                                                        type="color"
                                                        value={formData.styling.backgroundColor}
                                                        onChange={(e) => updateFormData('styling', 'backgroundColor', e.target.value)}
                                                        className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={formData.styling.backgroundColor}
                                                        onChange={(e) => updateFormData('styling', 'backgroundColor', e.target.value)}
                                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Text Color
                                                </label>
                                                <div className="flex items-center space-x-3">
                                                    <input
                                                        type="color"
                                                        value={formData.styling.textColor}
                                                        onChange={(e) => updateFormData('styling', 'textColor', e.target.value)}
                                                        className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={formData.styling.textColor}
                                                        onChange={(e) => updateFormData('styling', 'textColor', e.target.value)}
                                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-md font-medium text-gray-900 mb-4">Typography & Layout</h4>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Font Family
                                                </label>
                                                <select
                                                    value={formData.styling.fontFamily}
                                                    onChange={(e) => updateFormData('styling', 'fontFamily', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="Inter, sans-serif">Inter</option>
                                                    <option value="Roboto, sans-serif">Roboto</option>
                                                    <option value="Open Sans, sans-serif">Open Sans</option>
                                                    <option value="Poppins, sans-serif">Poppins</option>
                                                    <option value="Nunito, sans-serif">Nunito</option>
                                                    <option value="Lato, sans-serif">Lato</option>
                                                    <option value="Montserrat, sans-serif">Montserrat</option>
                                                    <option value="system-ui, sans-serif">System Default</option>
                                                </select>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Font Size (px)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="10"
                                                        max="24"
                                                        value={formData.styling.fontSize}
                                                        onChange={(e) => updateFormData('styling', 'fontSize', parseInt(e.target.value) || 14)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Border Radius (px)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="50"
                                                        value={formData.styling.borderRadius}
                                                        onChange={(e) => updateFormData('styling', 'borderRadius', parseInt(e.target.value) || 8)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Position
                                                </label>
                                                <select
                                                    value={formData.styling.position}
                                                    onChange={(e) => updateFormData('styling', 'position', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="bottom-right">Bottom Right</option>
                                                    <option value="bottom-left">Bottom Left</option>
                                                    <option value="center">Center</option>
                                                    <option value="top-right">Top Right</option>
                                                    <option value="top-left">Top Left</option>
                                                </select>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Width (px)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="250"
                                                        max="600"
                                                        value={formData.styling.width}
                                                        onChange={(e) => updateFormData('styling', 'width', parseInt(e.target.value) || 350)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Height (px)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="300"
                                                        max="800"
                                                        value={formData.styling.height}
                                                        onChange={(e) => updateFormData('styling', 'height', parseInt(e.target.value) || 500)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Button Style
                                                </label>
                                                <select
                                                    value={formData.styling.buttonStyle}
                                                    onChange={(e) => updateFormData('styling', 'buttonStyle', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="round">Round</option>
                                                    <option value="square">Square</option>
                                                    <option value="rounded">Rounded Corners</option>
                                                </select>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        id="shadowEnabled"
                                                        checked={formData.styling.shadowEnabled}
                                                        onChange={(e) => updateFormData('styling', 'shadowEnabled', e.target.checked)}
                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                    />
                                                    <label htmlFor="shadowEnabled" className="ml-2 block text-sm text-gray-900">
                                                        Enable drop shadow
                                                    </label>
                                                </div>

                                                <div className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        id="animationEnabled"
                                                        checked={formData.styling.animationEnabled}
                                                        onChange={(e) => updateFormData('styling', 'animationEnabled', e.target.checked)}
                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                    />
                                                    <label htmlFor="animationEnabled" className="ml-2 block text-sm text-gray-900">
                                                        Enable smooth animations
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Live Preview */}
                                <div className="space-y-6">
                                    <h4 className="text-md font-medium text-gray-900">Live Preview</h4>
                                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 min-h-96 relative">
                                        <div className="text-center text-gray-500 text-sm mb-4">
                                            Chat widget preview (scaled down)
                                        </div>

                                        {/* Simulated chat widget */}
                                        <div
                                            className={`absolute transition-all duration-300 ${formData.styling.position === 'bottom-right' ? 'bottom-4 right-4' :
                                                    formData.styling.position === 'bottom-left' ? 'bottom-4 left-4' :
                                                        formData.styling.position === 'center' ? 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2' :
                                                            formData.styling.position === 'top-right' ? 'top-4 right-4' :
                                                                'top-4 left-4'
                                                } border border-gray-200 overflow-hidden flex flex-col`}
                                            style={{
                                                width: `${Math.min(formData.styling.width * 0.6, 200)}px`,
                                                height: `${Math.min(formData.styling.height * 0.6, 150)}px`,
                                                backgroundColor: formData.styling.backgroundColor,
                                                color: formData.styling.textColor,
                                                borderRadius: `${formData.styling.borderRadius}px`,
                                                fontSize: `${Math.min(formData.styling.fontSize * 0.8, 12)}px`,
                                                fontFamily: formData.styling.fontFamily,
                                                boxShadow: formData.styling.shadowEnabled ? '0 4px 12px rgba(0,0,0,0.15)' : 'none'
                                            }}
                                        >
                                            {/* Header */}
                                            <div
                                                style={{ backgroundColor: formData.styling.primaryColor }}
                                                className="p-2 text-white text-xs font-medium flex-shrink-0"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span>Chat Support</span>
                                                    <span className="opacity-75">×</span>
                                                </div>
                                            </div>

                                            {/* Message area */}
                                            <div className="p-2 flex-1 overflow-hidden">
                                                <div className="bg-gray-100 rounded p-2 text-xs mb-2">
                                                    {formData.config.greeting.substring(0, 40)}
                                                    {formData.config.greeting.length > 40 && '...'}
                                                </div>
                                                <div
                                                    style={{ backgroundColor: formData.styling.primaryColor + '20' }}
                                                    className="rounded p-2 text-xs ml-auto max-w-24 text-right"
                                                >
                                                    Hi there!
                                                </div>
                                            </div>

                                            {/* Input area */}
                                            <div className="border-t p-2 flex-shrink-0">
                                                <div className="flex items-center space-x-1">
                                                    <div className="flex-1 bg-gray-100 rounded px-2 py-1 text-xs">
                                                        Type message...
                                                    </div>
                                                    <div
                                                        style={{ backgroundColor: formData.styling.primaryColor }}
                                                        className={`w-6 h-6 text-white flex items-center justify-center text-xs ${formData.styling.buttonStyle === 'round' ? 'rounded-full' :
                                                            formData.styling.buttonStyle === 'square' ? 'rounded-none' :
                                                                'rounded'
                                                            }`}
                                                    >
                                                        →
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Toggle button preview */}
                                        <div
                                            className={`absolute ${formData.styling.position === 'bottom-right' ? 'bottom-4 right-6' :
                                                formData.styling.position === 'bottom-left' ? 'bottom-4 left-6' :
                                                    'bottom-4 right-6'
                                                } w-12 h-12 text-white flex items-center justify-center cursor-pointer hover:scale-105 transition-transform ${formData.styling.buttonStyle === 'round' ? 'rounded-full' :
                                                    formData.styling.buttonStyle === 'square' ? 'rounded-none' :
                                                        'rounded-lg'
                                                }`}
                                            style={{
                                                backgroundColor: formData.styling.primaryColor,
                                                boxShadow: formData.styling.shadowEnabled ? '0 4px 12px rgba(0,0,0,0.15)' : 'none'
                                            }}
                                        >

                                            💬
                                        </div>
                                    </div>

                                    <div className="text-center">
                                        <p className="text-sm text-gray-600">
                                            Preview updates in real-time as you change settings
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Tab.Panel>

                    {/* AI Settings Tab */}
                    <Tab.Panel className="space-y-6">
                        <div className="bg-white shadow rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">AI Configuration</h3>

                            <div className="space-y-6">
                                <div className="flex items-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <input
                                        type="checkbox"
                                        id="aiEnabled"
                                        checked={formData.ai.enabled}
                                        onChange={(e) => updateFormData('ai', 'enabled', e.target.checked)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-blue-300 rounded"
                                    />
                                    <label htmlFor="aiEnabled" className="ml-3 block text-sm font-medium text-blue-900">
                                        Enable AI-powered responses
                                    </label>
                                    <div className="ml-auto">
                                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                            Pro Feature
                                        </span>
                                    </div>
                                </div>

                                {formData.ai.enabled && (
                                    <div className="space-y-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    AI Provider
                                                </label>
                                                <select
                                                    value={formData.ai.provider}
                                                    onChange={(e) => updateFormData('ai', 'provider', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="openai">OpenAI (GPT)</option>
                                                    <option value="anthropic">Anthropic (Claude)</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Model
                                                </label>
                                                <select
                                                    value={formData.ai.model}
                                                    onChange={(e) => updateFormData('ai', 'model', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    {formData.ai.provider === 'openai' ? (
                                                        <>
                                                            <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Fast & Cost-effective)</option>
                                                            <option value="gpt-4">GPT-4 (Most Capable)</option>
                                                            <option value="gpt-4-turbo">GPT-4 Turbo (Latest)</option>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <option value="claude-3-haiku">Claude 3 Haiku (Fast)</option>
                                                            <option value="claude-3-sonnet">Claude 3 Sonnet (Balanced)</option>
                                                            <option value="claude-3-opus">Claude 3 Opus (Most Capable)</option>
                                                        </>
                                                    )}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Creativity Level: {formData.ai.temperature}
                                                </label>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="2"
                                                    step="0.1"
                                                    value={formData.ai.temperature}
                                                    onChange={(e) => updateFormData('ai', 'temperature', parseFloat(e.target.value))}
                                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                                />
                                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                                    <span>Conservative</span>
                                                    <span>Creative</span>
                                                </div>
                                                <p className="text-xs text-gray-600 mt-1">
                                                    Lower values = more consistent, Higher values = more creative
                                                </p>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Max Response Length (tokens)
                                                </label>
                                                <input
                                                    type="number"
                                                    min="50"
                                                    max="1000"
                                                    value={formData.ai.maxTokens}
                                                    onChange={(e) => updateFormData('ai', 'maxTokens', parseInt(e.target.value) || 150)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                                <p className="text-xs text-gray-600 mt-1">
                                                    Approximately 4 characters = 1 token
                                                </p>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                System Instructions
                                            </label>
                                            <textarea
                                                value={formData.ai.systemPrompt}
                                                onChange={(e) => updateFormData('ai', 'systemPrompt', e.target.value)}
                                                rows={4}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="You are a helpful customer support assistant for [Company Name]. Be friendly, professional, and helpful. Always try to solve the customer's problem."
                                            />
                                            <p className="mt-1 text-sm text-gray-500">
                                                This defines how the AI should behave. Be specific about your company, tone, and guidelines.
                                            </p>
                                        </div>

                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="fallbackToRules"
                                                checked={formData.ai.fallbackToRules}
                                                onChange={(e) => updateFormData('ai', 'fallbackToRules', e.target.checked)}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor="fallbackToRules" className="ml-2 block text-sm text-gray-900">
                                                Use knowledge base when AI is unavailable
                                            </label>
                                        </div>

                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                            <h4 className="text-sm font-medium text-yellow-800 mb-2">AI Best Practices</h4>
                                            <ul className="text-sm text-yellow-700 space-y-1">
                                                <li>• Add specific company information to system instructions</li>
                                                <li>• Use knowledge base for consistent answers to common questions</li>
                                                <li>• Start with conservative creativity (0.3-0.7) and adjust based on results</li>
                                                <li>• Monitor AI responses and refine instructions as needed</li>
                                            </ul>
                                        </div>
                                    </div>
                                )}

                                {!formData.ai.enabled && (
                                    <div className="text-center py-8">
                                        <div className="text-4xl mb-4">🤖</div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                                            AI-Powered Responses
                                        </h3>
                                        <p className="text-gray-600 mb-4">
                                            Enable AI to provide intelligent, contextual responses to your visitors.
                                            Your chatbot will use your knowledge base combined with AI to give better answers.
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                                            <div className="text-center">
                                                <div className="text-2xl mb-2">💡</div>
                                                <h4 className="font-medium">Smart Responses</h4>
                                                <p className="text-sm text-gray-600">AI understands context and provides relevant answers</p>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl mb-2">🎯</div>
                                                <h4 className="font-medium">Always On-brand</h4>
                                                <p className="text-sm text-gray-600">Follows your guidelines and company tone</p>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl mb-2">🔄</div>
                                                <h4 className="font-medium">Reliable Fallback</h4>
                                                <p className="text-sm text-gray-600">Uses knowledge base when AI is unavailable</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Tab.Panel>
                </Tab.Panels>
            </Tab.Group>

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                    * Required fields
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            {submitText === 'Create Chatbot' ? 'Creating...' : 'Saving...'}
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {submitText}
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}