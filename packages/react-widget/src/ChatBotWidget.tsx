import { useEffect } from "react";

export interface ChatBotWidgetProps {
    chatbotId: string;
    apiUrl?: string;
    title?: string;
    greeting?: string;
    primaryColor?: string;
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';
    width?: number;
    height?: number;
    autoOpen?: boolean;
    openDelay?: number;
    showUnreadCount?: boolean;
    collectFeedback?: boolean;
    onReady?: (widget: any) => void;
    onMessage?: (message: string, type: 'user' | 'bot') => void;
    onOpen?: () => void;
    onClose?: () => void;
    customStyles?: React.CSSProperties;
    className?: string;
}

export function ChatBotWidget({
    chatbotId,
    apiUrl = 'https://api.chatbot-builder.com',
    title = 'Chat Support',
    greeting = 'Hello! How can I help you?',
    primaryColor = '#007bff',
    position = 'bottom-right',
    width = 350,
    height = 500,
    autoOpen = false,
    openDelay = 3000,
    showUnreadCount = true,
    collectFeedback = true,
    onReady,
    onMessage,
    onOpen,
    onClose,
    customStyles,
    className
}: ChatBotWidgetProps) {
    useEffect(() => {
        // Load widget script dynamically
        const script = document.createElement('script');
        script.src = `${apiUrl}/api/widget/${chatbotId}`;
        script.setAttribute('data-chatbot-id', chatbotId);
        script.setAttribute('data-title', title);
        script.setAttribute('data-greeting', greeting);
        script.setAttribute('data-primary-color', primaryColor);
        script.setAttribute('data-position', position);
        script.setAttribute('data-width', width.toString());
        script.setAttribute('data-height', height.toString());

        if (autoOpen) {
            script.setAttribute('data-auto-open', 'true');
            script.setAttribute('data-open-delay', openDelay.toString());
        }

        if (showUnreadCount) {
            script.setAttribute('data-show-unread', 'true');
        }

        if (collectFeedback) {
            script.setAttribute('data-collect-feedback', 'true');
        }

        document.body.appendChild(script);

        // Set up event listeners
        const handleReady = (e: CustomEvent) => {
            if (onReady) onReady(e.detail.widget);
        };

        const handleMessage = (e: CustomEvent) => {
            if (onMessage) onMessage(e.detail.message, e.detail.type);
        };

        const handleOpen = () => {
            if (onOpen) onOpen();
        };

        const handleClose = () => {
            if (onClose) onClose();
        };

        window.addEventListener('chatbot-ready', handleReady as EventListener);
        window.addEventListener('chatbot-message', handleMessage as EventListener);
        window.addEventListener('chatbot-open', handleOpen);
        window.addEventListener('chatbot-close', handleClose);

        // Cleanup
        return () => {
            document.body.removeChild(script);
            window.removeEventListener('chatbot-ready', handleReady as EventListener);
            window.removeEventListener('chatbot-message', handleMessage as EventListener);
            window.removeEventListener('chatbot-open', handleOpen);
            window.removeEventListener('chatbot-close', handleClose);
        };
    }, [chatbotId, apiUrl, title, greeting, primaryColor, position, width, height, autoOpen, openDelay]);

    // Return null as the widget is rendered outside React tree
    return null;
}