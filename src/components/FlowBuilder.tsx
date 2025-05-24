'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface FlowNode {
    id: string;
    type: 'message' | 'condition' | 'action' | 'input' | 'delay';
    position: { x: number; y: number };
    content: {
        text?: string;
        buttons?: Array<{
            text: string;
            value: string;
            action: 'reply' | 'url' | 'phone' | 'email';
            url?: string;
        }>;
        inputType?: 'text' | 'email' | 'phone' | 'number' | 'file';
        validation?: {
            required: boolean;
            pattern?: string;
            minLength?: number;
            maxLength?: number;
        };
        delay?: number;
        condition?: {
            field: string;
            operator: 'equals' | 'contains' | 'starts_with' | 'ends_with';
            value: string;
        };
        action?: {
            type: 'collect_email' | 'collect_phone' | 'redirect' | 'webhook';
            url?: string;
            message?: string;
        };
    };
    connections: string[];
}

interface Flow {
    id: string;
    name: string;
    description?: string;
    trigger: {
        type: 'keyword' | 'intent' | 'button' | 'condition';
        value: string;
    };
    nodes: FlowNode[];
}

interface FlowBuilderProps {
    flow?: Flow;
    onSave: (flow: Flow) => void;
    onCancel: () => void;
}

export default function FlowBuilder({ flow, onSave, onCancel }: FlowBuilderProps) {
    const [currentFlow, setCurrentFlow] = useState<Flow>(
        flow || {
            id: `flow_${Date.now()}`,
            name: 'New Flow',
            trigger: { type: 'keyword', value: '' },
            nodes: []
        }
    );

    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [draggedNode, setDraggedNode] = useState<FlowNode | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionStart, setConnectionStart] = useState<string | null>(null);

    const canvasRef = useRef<HTMLDivElement>(null);
    const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

    // Node templates for the toolbar
    const nodeTemplates = [
        {
            type: 'message',
            icon: '💬',
            label: 'Message',
            defaultContent: { text: 'Hello! How can I help you?' }
        },
        {
            type: 'condition',
            icon: '❓',
            label: 'Condition',
            defaultContent: {
                condition: { field: 'user_input', operator: 'contains', value: '' }
            }
        },
        {
            type: 'input',
            icon: '📝',
            label: 'User Input',
            defaultContent: {
                inputType: 'text',
                validation: { required: true }
            }
        },
        {
            type: 'action',
            icon: '⚡',
            label: 'Action',
            defaultContent: {
                action: { type: 'collect_email', message: 'Please provide your email' }
            }
        },
        {
            type: 'delay',
            icon: '⏱️',
            label: 'Delay',
            defaultContent: { delay: 2000 }
        }
    ];

    useEffect(() => {
        const updateCanvasSize = () => {
            if (canvasRef.current) {
                const rect = canvasRef.current.getBoundingClientRect();
                setCanvasSize({ width: rect.width, height: rect.height });
            }
        };

        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);
        return () => window.removeEventListener('resize', updateCanvasSize);
    }, []);

    const addNode = (type: string, position: { x: number; y: number }) => {
        const template = nodeTemplates.find(t => t.type === type);
        if (!template) return;

        const newNode: FlowNode = {
            id: `node_${Date.now()}`,
            type: type as FlowNode['type'],
            position,
            content: template.defaultContent as FlowNode['content'],
            connections: []
        };

        setCurrentFlow(prev => ({
            ...prev,
            nodes: [...prev.nodes, newNode]
        }));
    };

    const updateNode = (nodeId: string, updates: Partial<FlowNode>) => {
        setCurrentFlow(prev => ({
            ...prev,
            nodes: prev.nodes.map(node =>
                node.id === nodeId ? { ...node, ...updates } : node
            )
        }));
    };

    const deleteNode = (nodeId: string) => {
        setCurrentFlow(prev => ({
            ...prev,
            nodes: prev.nodes.filter(node => node.id !== nodeId)
                .map(node => ({
                    ...node,
                    connections: node.connections.filter(id => id !== nodeId)
                }))
        }));
        setSelectedNode(null);
    };

    const handleNodeConnect = (fromNodeId: string, toNodeId: string) => {
        if (fromNodeId === toNodeId) return;

        setCurrentFlow(prev => ({
            ...prev,
            nodes: prev.nodes.map(node =>
                node.id === fromNodeId
                    ? { ...node, connections: [...new Set([...node.connections, toNodeId])] }
                    : node
            )
        }));
    };

    const handleCanvasDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (!draggedNode || !canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const position = {
            x: e.clientX - rect.left - 75, // Center the node
            y: e.clientY - rect.top - 40
        };

        addNode(draggedNode.type, position);
        setDraggedNode(null);
    };

    const handleNodeDrag = (nodeId: string, position: { x: number; y: number }) => {
        updateNode(nodeId, { position });
    };

    return (
        <div className="flex h-full bg-gray-50">
            {/* Toolbar */}
            <div className="w-64 bg-white border-r border-gray-200 p-4">
                <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Flow Settings</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Flow Name
                            </label>
                            <input
                                title='name'
                                type="text"
                                value={currentFlow.name}
                                onChange={(e) => setCurrentFlow(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Trigger Type
                            </label>
                            <select
                                title='Trigger'
                                value={currentFlow.trigger.type}
                                onChange={(e) => setCurrentFlow(prev => ({
                                    ...prev,
                                    trigger: { ...prev.trigger, type: e.target.value as any }
                                }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            >
                                <option value="keyword">Keyword</option>
                                <option value="intent">Intent</option>
                                <option value="button">Button Click</option>
                                <option value="condition">Condition</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Trigger Value
                            </label>
                            <input
                                type="text"
                                value={currentFlow.trigger.value}
                                onChange={(e) => setCurrentFlow(prev => ({
                                    ...prev,
                                    trigger: { ...prev.trigger, value: e.target.value }
                                }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="e.g., help, support"
                            />
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Node Types</h3>
                    <div className="space-y-2">
                        {nodeTemplates.map((template) => (
                            <div
                                key={template.type}
                                draggable
                                onDragStart={(e) => {
                                    setDraggedNode({
                                        id: '',
                                        type: template.type,
                                        position: { x: 0, y: 0 },
                                        content: template.defaultContent,
                                        connections: []
                                    } as FlowNode);
                                }}
                                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-move hover:bg-gray-100 transition-colors"
                            >
                                <span className="text-2xl">{template.icon}</span>
                                <div>
                                    <div className="font-medium text-sm text-gray-900">{template.label}</div>
                                    <div className="text-xs text-gray-500">Drag to canvas</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <button
                        onClick={() => onSave(currentFlow)}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                        Save Flow
                    </button>
                    <button
                        onClick={onCancel}
                        className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors text-sm font-medium"
                    >
                        Cancel
                    </button>
                </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 relative">
                <div
                    ref={canvasRef}
                    className="w-full h-full overflow-auto bg-gray-100 relative"
                    onDrop={handleCanvasDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => setSelectedNode(null)}
                >
                    {/* Grid pattern */}
                    <div
                        className="absolute inset-0 opacity-20"
                        style={{
                            backgroundImage: `
                linear-gradient(rgba(0,0,0,.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,0,0,.1) 1px, transparent 1px)
              `,
                            backgroundSize: '20px 20px'
                        }}
                    />

                    {/* Connection lines */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        {currentFlow.nodes.map(node =>
                            node.connections.map(connectionId => {
                                const targetNode = currentFlow.nodes.find(n => n.id === connectionId);
                                if (!targetNode) return null;

                                const startX = node.position.x + 75;
                                const startY = node.position.y + 40;
                                const endX = targetNode.position.x + 75;
                                const endY = targetNode.position.y + 40;

                                return (
                                    <line
                                        key={`${node.id}-${connectionId}`}
                                        x1={startX}
                                        y1={startY}
                                        x2={endX}
                                        y2={endY}
                                        stroke="#3b82f6"
                                        strokeWidth="2"
                                        markerEnd="url(#arrowhead)"
                                    />
                                );
                            })
                        )}

                        {/* Arrow marker definition */}
                        <defs>
                            <marker
                                id="arrowhead"
                                markerWidth="10"
                                markerHeight="7"
                                refX="9"
                                refY="3.5"
                                orient="auto"
                            >
                                <polygon
                                    points="0 0, 10 3.5, 0 7"
                                    fill="#3b82f6"
                                />
                            </marker>
                        </defs>
                    </svg>

                    {/* Nodes */}
                    {currentFlow.nodes.map((node) => (
                        <FlowNodeComponent
                            key={node.id}
                            node={node}
                            isSelected={selectedNode === node.id}
                            onSelect={() => setSelectedNode(node.id)}
                            onUpdate={(updates) => updateNode(node.id, updates)}
                            onDelete={() => deleteNode(node.id)}
                            onConnect={(targetId) => handleNodeConnect(node.id, targetId)}
                            onDrag={(position) => handleNodeDrag(node.id, position)}
                            isConnecting={isConnecting}
                        />
                    ))}

                    {/* Empty state */}
                    {currentFlow.nodes.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center text-gray-500">
                                <div className="text-4xl mb-4">🎨</div>
                                <h3 className="text-lg font-medium mb-2">Start Building Your Flow</h3>
                                <p className="text-sm">Drag node types from the sidebar to create your conversation flow</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Node Editor Panel */}
            {selectedNode && (
                <NodeEditorPanel
                    node={currentFlow.nodes.find(n => n.id === selectedNode)!}
                    onUpdate={(updates) => updateNode(selectedNode, updates)}
                    onClose={() => setSelectedNode(null)}
                />
            )}
        </div>
    );
}

// Individual Flow Node Component
function FlowNodeComponent({
    node,
    isSelected,
    onSelect,
    onUpdate,
    onDelete,
    onConnect,
    onDrag,
    isConnecting
}: {
    node: FlowNode;
    isSelected: boolean;
    onSelect: () => void;
    onUpdate: (updates: Partial<FlowNode>) => void;
    onDelete: () => void;
    onConnect: (targetId: string) => void;
    onDrag: (position: { x: number; y: number }) => void;
    isConnecting: boolean;
}) {
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const getNodeIcon = () => {
        switch (node.type) {
            case 'message': return '💬';
            case 'condition': return '❓';
            case 'input': return '📝';
            case 'action': return '⚡';
            case 'delay': return '⏱️';
            default: return '🔷';
        }
    };

    const getNodeTitle = () => {
        switch (node.type) {
            case 'message': return node.content.text?.substring(0, 30) || 'Message';
            case 'condition': return `If ${node.content.condition?.field || '...'}`;
            case 'input': return `Input: ${node.content.inputType || 'text'}`;
            case 'action': return `Action: ${node.content.action?.type || '...'}`;
            case 'delay': return `Wait ${node.content.delay || 0}ms`;
            default: return 'Node';
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.target !== e.currentTarget) return;

        setIsDragging(true);
        setDragStart({
            x: e.clientX - node.position.x,
            y: e.clientY - node.position.y
        });

        const handleMouseMove = (e: MouseEvent) => {
            onDrag({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    return (
        <div
            className={`absolute cursor-move select-none ${isSelected ? 'z-20' : 'z-10'
                }`}
            style={{
                left: node.position.x,
                top: node.position.y,
                transform: isDragging ? 'scale(1.05)' : 'scale(1)'
            }}
            onMouseDown={handleMouseDown}
            onClick={(e) => {
                e.stopPropagation();
                onSelect();
            }}
        >
            <div
                className={`w-40 bg-white rounded-lg shadow-md border-2 transition-all ${isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-200'
                    } hover:shadow-lg`}
            >
                {/* Node Header */}
                <div className="p-3 border-b border-gray-100">
                    <div className="flex items-center space-x-2">
                        <span className="text-lg">{getNodeIcon()}</span>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                                {getNodeTitle()}
                            </div>
                            <div className="text-xs text-gray-500 capitalize">
                                {node.type}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Node Actions */}
                {isSelected && (
                    <div className="p-2 border-t border-gray-100 bg-gray-50 rounded-b-lg">
                        <div className="flex items-center justify-between">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    // Toggle connection mode
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800"
                            >
                                Connect
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete();
                                }}
                                className="text-xs text-red-600 hover:text-red-800"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                )}

                {/* Connection points */}
                <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow cursor-pointer hover:bg-blue-600" />
                <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-gray-400 rounded-full border-2 border-white shadow" />
            </div>
        </div>
    );
}

// Node Editor Panel Component
function NodeEditorPanel({
    node,
    onUpdate,
    onClose
}: {
    node: FlowNode;
    onUpdate: (updates: Partial<FlowNode>) => void;
    onClose: () => void;
}) {
    const updateContent = (field: string, value: any) => {
        onUpdate({
            content: {
                ...node.content,
                [field]: value
            }
        });
    };

    return (
        <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Edit Node</h3>
                <button
                    title='Edit'
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="space-y-4">
                {/* Node Type Display */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Node Type
                    </label>
                    <div className="px-3 py-2 bg-gray-100 rounded-md text-sm text-gray-900 capitalize">
                        {node.type}
                    </div>
                </div>

                {/* Message Node Editor */}
                {node.type === 'message' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Message Text
                        </label>
                        <textarea
                            value={node.content.text || ''}
                            onChange={(e) => updateContent('text', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="Enter your message..."
                        />
                    </div>
                )}

                {/* Condition Node Editor */}
                {node.type === 'condition' && (
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Field to Check
                            </label>
                            <input
                                type="text"
                                value={node.content.condition?.field || ''}
                                onChange={(e) => updateContent('condition', {
                                    ...node.content.condition,
                                    field: e.target.value
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="user_input"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Operator
                            </label>
                            <select
                                title='Operator'
                                value={node.content.condition?.operator || 'contains'}
                                onChange={(e) => updateContent('condition', {
                                    ...node.content.condition,
                                    operator: e.target.value
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            >
                                <option value="equals">Equals</option>
                                <option value="contains">Contains</option>
                                <option value="starts_with">Starts with</option>
                                <option value="ends_with">Ends with</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Value
                            </label>
                            <input
                                type="text"
                                value={node.content.condition?.value || ''}
                                onChange={(e) => updateContent('condition', {
                                    ...node.content.condition,
                                    value: e.target.value
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="Expected value"
                            />
                        </div>
                    </div>
                )}

                {/* Input Node Editor */}
                {node.type === 'input' && (
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Input Type
                            </label>
                            <select
                                title='Input'
                                value={node.content.inputType || 'text'}
                                onChange={(e) => updateContent('inputType', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            >
                                <option value="text">Text</option>
                                <option value="email">Email</option>
                                <option value="phone">Phone</option>
                                <option value="number">Number</option>
                                <option value="file">File</option>
                            </select>
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="required"
                                checked={node.content.validation?.required || false}
                                onChange={(e) => updateContent('validation', {
                                    ...node.content.validation,
                                    required: e.target.checked
                                })}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="required" className="ml-2 block text-sm text-gray-900">
                                Required field
                            </label>
                        </div>
                    </div>
                )}

                {/* Action Node Editor */}
                {node.type === 'action' && (
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Action Type
                            </label>
                            <select
                                title='Action'
                                value={node.content.action?.type || 'collect_email'}
                                onChange={(e) => updateContent('action', {
                                    ...node.content.action,
                                    type: e.target.value
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            >
                                <option value="collect_email">Collect Email</option>
                                <option value="collect_phone">Collect Phone</option>
                                <option value="redirect">Redirect URL</option>
                                <option value="webhook">Webhook</option>
                            </select>
                        </div>

                        {(node.content.action?.type === 'redirect' || node.content.action?.type === 'webhook') && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    URL
                                </label>
                                <input
                                    type="url"
                                    value={node.content.action?.url || ''}
                                    onChange={(e) => updateContent('action', {
                                        ...node.content.action,
                                        url: e.target.value
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder="https://example.com"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Message
                            </label>
                            <textarea
                                value={node.content.action?.message || ''}
                                onChange={(e) => updateContent('action', {
                                    ...node.content.action,
                                    message: e.target.value
                                })}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                placeholder="Action message..."
                            />
                        </div>
                    </div>
                )}

                {/* Delay Node Editor */}
                {node.type === 'delay' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Delay (milliseconds)
                        </label>
                        <input
                            title='Delay'
                            type="number"
                            min="0"
                            max="30000"
                            value={node.content.delay || 0}
                            onChange={(e) => updateContent('delay', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Time to wait before next action (0-30 seconds)
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}