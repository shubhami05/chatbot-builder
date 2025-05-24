'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface AnalyticsTabProps {
    chatbot: any;
    onUpdate: (updates: any) => Promise<boolean>;
    saving: boolean;
}

export default function AnalyticsTab({ chatbot }: AnalyticsTabProps) {
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('30');
    const [conversations, setConversations] = useState([]);

    useEffect(() => {
        fetchAnalytics();
        fetchConversations();
    }, [period]);

    const fetchAnalytics = async () => {
        try {
            const response = await fetch(`/api/chatbots/${chatbot._id}/analytics?period=${period}`);
            const data = await response.json();
            setAnalytics(data.analytics);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchConversations = async () => {
        try {
            const response = await fetch(`/api/chatbots/${chatbot._id}/conversations?limit=10`);
            const data = await response.json();
            setConversations(data.conversations || []);
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
        }
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Period Selector */}
            <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Analytics Overview</h3>
                    <select
                        title='Period'
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="7">Last 7 days</option>
                        <option value="30">Last 30 days</option>
                        <option value="90">Last 90 days</option>
                    </select>
                </div>

                {/* Summary Cards */}
                {analytics && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">{analytics.summary.totalConversations}</div>
                            <div className="text-sm text-blue-800">Total Conversations</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">{analytics.summary.totalMessages}</div>
                            <div className="text-sm text-green-800">Total Messages</div>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">{Math.round(analytics.summary.avgSessionDuration / 1000)}s</div>
                            <div className="text-sm text-purple-800">Avg Session Duration</div>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg">
                            <div className="text-2xl font-bold text-yellow-600">{analytics.summary.conversionRate}%</div>
                            <div className="text-sm text-yellow-800">Conversion Rate</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Charts */}
            {analytics && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Daily Activity Chart */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h4 className="text-md font-medium text-gray-900 mb-4">Daily Activity</h4>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={analytics.dailyStats}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(value: string | number | Date) => new Date(value).toLocaleDateString()}
                                />
                                <YAxis />
                                <Tooltip
                                    labelFormatter={(value: string | number | Date) => new Date(value).toLocaleDateString()}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="conversations"
                                    stroke="#8884d8"
                                    strokeWidth={2}
                                    name="Conversations"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="messages"
                                    stroke="#82ca9d"
                                    strokeWidth={2}
                                    name="Messages"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Satisfaction Distribution */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h4 className="text-md font-medium text-gray-900 mb-4">Satisfaction Ratings</h4>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={Object.entries(analytics.satisfactionDistribution).map(([rating, count]) => ({
                                        name: `${rating} Star${rating !== '1' ? 's' : ''}`,
                                        value: count,
                                        rating: parseInt(rating)
                                    }))}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, value }:any) => value > 0 ? `${name}: ${value}` : ''}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {Object.entries(analytics.satisfactionDistribution).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Top Questions */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h4 className="text-md font-medium text-gray-900 mb-4">Most Common Questions</h4>
                        <div className="space-y-3">
                            {analytics.topQuestions.slice(0, 5).map((item: any, index: number) => (
                                <div key={index} className="flex items-center justify-between">
                                    <span className="text-sm text-gray-900 flex-1">{item.question}</span>
                                    <span className="text-sm font-medium text-gray-600 ml-2">{item.count}</span>
                                </div>
                            ))}
                            {analytics.topQuestions.length === 0 && (
                                <p className="text-sm text-gray-500">No common questions identified yet</p>
                            )}
                        </div>
                    </div>

                    {/* Response Time Stats */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h4 className="text-md font-medium text-gray-900 mb-4">Response Time Analysis</h4>
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Average:</span>
                                <span className="text-sm font-medium">{Math.round(analytics.responseTimeStats.avg)}ms</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Fastest:</span>
                                <span className="text-sm font-medium text-green-600">{analytics.responseTimeStats.min}ms</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Slowest:</span>
                                <span className="text-sm font-medium text-red-600">{analytics.responseTimeStats.max}ms</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Median:</span>
                                <span className="text-sm font-medium">{Math.round(analytics.responseTimeStats.median)}ms</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Conversations */}
            <div className="bg-white shadow rounded-lg p-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Recent Conversations</h4>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Session
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Started
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Messages
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Duration
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Lead
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {conversations.map((conversation: any) => (
                                <tr key={conversation._id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {conversation.sessionId.substring(0, 8)}...
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(conversation.startedAt).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {conversation.messages?.length || 0}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {conversation.duration ? `${Math.round(conversation.duration / 1000)}s` : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${conversation.status === 'active' ? 'bg-green-100 text-green-800' :
                                                conversation.status === 'ended' ? 'bg-gray-100 text-gray-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {conversation.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {conversation.lead?.email ? (
                                            <span className="text-green-600">✓ {conversation.lead.email}</span>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {conversations.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            <p>No conversations yet</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}