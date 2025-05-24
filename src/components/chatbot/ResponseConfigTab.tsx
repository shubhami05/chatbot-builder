'use client';

import { useState } from 'react';

interface ResponseConfigTabProps {
    chatbot: any;
    onUpdate: (updates: any) => Promise<boolean>;
    saving: boolean;
}

export default function ResponseConfigTab({ chatbot, onUpdate, saving }: ResponseConfigTabProps) {
    const [config, setConfig] = useState({
        greeting: chatbot.config?.greeting || 'Hello! How can I help you today?',
        fallbackMessage: chatbot.config?.fallbackMessage || 'I\'m sorry, I didn\'t understand that.',
        collectEmail: chatbot.config?.collectEmail || false,
        collectPhone: chatbot.config?.collectPhone || false,
        allowFileUpload: chatbot.config?.allowFileUpload || false,
        maxFileSize: chatbot.config?.maxFileSize || 5,
        allowedFileTypes: chatbot.config?.allowedFileTypes || ['jpg', 'png', 'pdf'],
        language: chatbot.config?.language || 'en',
        responseDelay: chatbot.config?.responseDelay || 1000,
        businessHours: {
            enabled: chatbot.config?.businessHours?.enabled || false,
            timezone: chatbot.config?.businessHours?.timezone || 'UTC',
            schedule: chatbot.config?.businessHours?.schedule || [],
            outsideHoursMessage: chatbot.config?.businessHours?.outsideHoursMessage || 'Thanks for your message! We\'ll get back to you during business hours.'
        }
    });

    const [knowledgeBase, setKnowledgeBase] = useState(
        chatbot.knowledgeBase || []
    );

    const [newKbItem, setNewKbItem] = useState({
        question: '',
        answer: '',
        keywords: '',
        category: ''
    });

    const handleConfigSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onUpdate({ config });
    };

    const handleKnowledgeBaseSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

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

        const updatedKb = [...knowledgeBase, kbItem];
        setKnowledgeBase(updatedKb);
        setNewKbItem({ question: '', answer: '', keywords: '', category: '' });

        await onUpdate({ knowledgeBase: updatedKb });
    };

    const deleteKbItem = async (id: string) => {
        const updatedKb = knowledgeBase.filter((item: any) => item.id !== id);
        setKnowledgeBase(updatedKb);
        await onUpdate({ knowledgeBase: updatedKb });
    };

    const toggleKbItem = async (id: string) => {
        const updatedKb = knowledgeBase.map((item: any) =>
            item.id === id ? { ...item, isActive: !item.isActive } : item
        );
        setKnowledgeBase(updatedKb);
        await onUpdate({ knowledgeBase: updatedKb });
    };

    return (
        <div className="space-y-8">
            {/* Basic Response Configuration */}
            <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Response Configuration</h3>

                <form onSubmit={handleConfigSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Greeting Message *
                            </label>
                            <textarea
                                value={config.greeting}
                                onChange={(e) => setConfig(prev => ({ ...prev, greeting: e.target.value }))}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Hello! How can I help you today?"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Fallback Message
                            </label>
                            <textarea
                                value={config.fallbackMessage}
                                onChange={(e) => setConfig(prev => ({ ...prev, fallbackMessage: e.target.value }))}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="I'm sorry, I didn't understand that..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Language
                            </label>
                            <select
                                title='Language'
                                value={config.language}
                                onChange={(e) => setConfig(prev => ({ ...prev, language: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="en">English</option>
                                <option value="es">Spanish</option>
                                <option value="fr">French</option>
                                <option value="de">German</option>
                                <option value="hi">Hindi</option>
                                <option value="pt">Portuguese</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Response Delay (ms)
                            </label>
                            <input
                                title='Response delay'
                                type="number"
                                min="0"
                                max="10000"
                                value={config.responseDelay}
                                onChange={(e) => setConfig(prev => ({ ...prev, responseDelay: parseInt(e.target.value) || 0 }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-md font-medium text-gray-900">Data Collection</h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="collectEmail"
                                    checked={config.collectEmail}
                                    onChange={(e) => setConfig(prev => ({ ...prev, collectEmail: e.target.checked }))}
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
                                    checked={config.collectPhone}
                                    onChange={(e) => setConfig(prev => ({ ...prev, collectPhone: e.target.checked }))}
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
                                checked={config.allowFileUpload}
                                onChange={(e) => setConfig(prev => ({ ...prev, allowFileUpload: e.target.checked }))}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="allowFileUpload" className="ml-2 block text-sm text-gray-900">
                                Allow file uploads
                            </label>
                        </div>

                        {config.allowFileUpload && (
                            <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Max File Size (MB)
                                    </label>
                                    <input
                                        title='Max file size'
                                        type="number"
                                        min="1"
                                        max="50"
                                        value={config.maxFileSize}
                                        onChange={(e) => setConfig(prev => ({ ...prev, maxFileSize: parseInt(e.target.value) || 5 }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Allowed File Types
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {['jpg', 'png', 'gif', 'pdf', 'doc', 'docx', 'txt'].map(type => (
                                            <label key={type} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={config.allowedFileTypes.includes(type)}
                                                    onChange={(e) => {
                                                        const types = e.target.checked
                                                            ? [...config.allowedFileTypes, type]
                                                            : config.allowedFileTypes.filter((t: string) => t !== type);
                                                        setConfig(prev => ({ ...prev, allowedFileTypes: types }));
                                                    }}
                                                    className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                />
                                                <span className="ml-1 text-xs text-gray-700">{type}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Configuration'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Knowledge Base */}
            <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Knowledge Base</h3>

                {/* Add new KB item */}
                <form onSubmit={handleKnowledgeBaseSubmit} className="space-y-4 mb-8 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900">Add New FAQ</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Question *
                            </label>
                            <input
                                type="text"
                                value={newKbItem.question}
                                onChange={(e) => setNewKbItem(prev => ({ ...prev, question: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="What are your business hours?"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Category
                            </label>
                            <input
                                type="text"
                                value={newKbItem.category}
                                onChange={(e) => setNewKbItem(prev => ({ ...prev, category: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="General, Support, Billing..."
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Answer *
                        </label>
                        <textarea
                            value={newKbItem.answer}
                            onChange={(e) => setNewKbItem(prev => ({ ...prev, answer: e.target.value }))}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="We're open Monday through Friday from 9 AM to 5 PM EST."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Keywords (comma-separated)
                        </label>
                        <input
                            type="text"
                            value={newKbItem.keywords}
                            onChange={(e) => setNewKbItem(prev => ({ ...prev, keywords: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="hours, time, open, closed"
                        />
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={!newKbItem.question.trim() || !newKbItem.answer.trim()}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Add FAQ
                        </button>
                    </div>
                </form>

                {/* Existing KB items */}
                <div className="space-y-4">
                    {knowledgeBase.length > 0 ? (
                        knowledgeBase.map((item: any) => (
                            <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <h5 className="font-medium text-gray-900">{item.question}</h5>
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${item.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {item.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                            {item.category && (
                                                <span className="inline-flex px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                                    {item.category}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2">{item.answer}</p>
                                        {item.keywords && item.keywords.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {item.keywords.map((keyword: string, idx: number) => (
                                                    <span key={idx} className="inline-flex px-2 py-1 text-xs rounded bg-gray-100 text-gray-700">
                                                        {keyword}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center space-x-2 ml-4">
                                        <button
                                            onClick={() => toggleKbItem(item.id)}
                                            className={`text-sm font-medium ${item.isActive ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'
                                                }`}
                                        >
                                            {item.isActive ? 'Deactivate' : 'Activate'}
                                        </button>
                                        <button
                                            onClick={() => deleteKbItem(item.id)}
                                            className="text-sm font-medium text-red-600 hover:text-red-800"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <div className="text-4xl mb-2">📚</div>
                            <p>No FAQ items yet</p>
                            <p className="text-sm">Add some questions and answers to help your chatbot respond better</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}