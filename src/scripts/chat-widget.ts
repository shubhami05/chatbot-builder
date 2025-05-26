/**
 * ChatBot Builder - Embeddable Widget Loader
 * This script loads asynchronously and creates the chat widget
 */

import { AnyARecord } from "node:dns";


(function () {
    'use strict';

    interface ChatBotConfig {
        chatbotId: string | null | undefined;
        apiUrl: string;
        position: string;
        primaryColor: string;
        title: string;
        greeting: string;
        placeholder: string;
        autoOpen: boolean;
        openDelay: number;
    }

    // Prevent multiple instances
    if (window.ChatBotBuilder) {
        return;
    }

    // Configuration from script attributes
    const currentScript = document.currentScript || document.querySelector('script[data-chatbot-id]');
    const config:ChatBotConfig = {
        chatbotId: currentScript?.getAttribute('data-chatbot-id'),
        apiUrl: currentScript?.getAttribute('data-api-url') || 'https://your-domain.com/api',
        position: currentScript?.getAttribute('data-position') || 'bottom-right',
        primaryColor: currentScript?.getAttribute('data-primary-color') || '#007bff',
        title: currentScript?.getAttribute('data-title') || 'Chat Support',
        greeting: currentScript?.getAttribute('data-greeting') || 'Hello! How can I help you?',
        placeholder: currentScript?.getAttribute('data-placeholder') || 'Type your message...',
        autoOpen: currentScript?.getAttribute('data-auto-open') === 'true',
        openDelay: parseInt(currentScript?.getAttribute('data-open-delay') || '3000'),
    };

    // Validate required config
    if (!config.chatbotId) {
        console.error('ChatBot Builder: data-chatbot-id is required');
        return;
    }

    // Main ChatBot class
    class ChatBotWidget {
        config: ChatBotConfig;
        isOpen: boolean;
        isMinimized: boolean;
        sessionId: string;
        messages: never[];
        socket: null;
        isTyping: boolean;
        unreadCount: number;
        visitorInfo: { userAgent: string; referrer: string; url: string; timestamp: string; timezone: string; language: string; screenResolution: string; viewport: string; } | undefined;
        container: HTMLDivElement | undefined;
        toggleBtn: HTMLButtonElement | undefined;
        unreadBadge: HTMLDivElement | undefined;
        chatWindow: HTMLDivElement | undefined;
        messagesContainer: any;
        input: any;
        sendBtn: any;
        typingIndicator: any;
        constructor(config: ChatBotConfig) { 
            this.config = config;
            this.isOpen = false;
            this.isMinimized = false;
            this.sessionId = this.generateSessionId();
            this.messages = [];
            this.socket = null;
            this.isTyping = false;
            this.unreadCount = 0;
            this.init();
        }

        generateSessionId() {
            return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        init() {
            this.createStyles();
            this.createWidget();
            this.bindEvents();
            this.initializeWebSocket();

            // Auto-open if configured
            if (this.config.autoOpen) {
                setTimeout(() => this.openWidget(), this.config.openDelay);
            }

            // Track visitor info
            this.visitorInfo = this.getVisitorInfo();
        }

        createStyles() {
            const style = document.createElement('style');
            style.textContent = `
                /* ChatBot Widget Styles - Scoped to prevent conflicts */
                .chatbot-widget-container {
                    position: fixed;
                    z-index: 2147483647;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                    font-size: 14px;
                    line-height: 1.4;
                    color: #333;
                    direction: ltr;
                    text-align: left;
                }

                .chatbot-widget-container * {
                    box-sizing: border-box;
                }

                /* Position variants */
                .chatbot-widget-container.position-bottom-right {
                    bottom: 20px;
                    right: 20px;
                }

                .chatbot-widget-container.position-bottom-left {
                    bottom: 20px;
                    left: 20px;
                }

                .chatbot-widget-container.position-top-right {
                    top: 20px;
                    right: 20px;
                }

                .chatbot-widget-container.position-top-left {
                    top: 20px;
                    left: 20px;
                }

                /* Toggle Button */
                .chatbot-toggle-btn {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: ${this.config.primaryColor};
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                }

                .chatbot-toggle-btn:hover {
                    transform: scale(1.1);
                    box-shadow: 0 6px 20px rgba(0,0,0,0.2);
                }

                .chatbot-toggle-btn svg {
                    width: 24px;
                    height: 24px;
                    fill: white;
                    transition: transform 0.3s ease;
                }

                .chatbot-toggle-btn.open svg.chat-icon {
                    transform: rotate(180deg) scale(0);
                }

                .chatbot-toggle-btn.open svg.close-icon {
                    transform: rotate(0deg) scale(1);
                }

                .chatbot-toggle-btn svg.close-icon {
                    position: absolute;
                    transform: rotate(180deg) scale(0);
                }

                /* Unread Badge */
                .chatbot-unread-badge {
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    background: #ff4757;
                    color: white;
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    font-weight: bold;
                    animation: chatbot-pulse 2s infinite;
                }

                @keyframes chatbot-pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); }
                }

                /* Chat Window */
                .chatbot-window {
                    position: absolute;
                    bottom: 80px;
                    right: 0;
                    width: 350px;
                    height: 500px;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 8px 30px rgba(0,0,0,0.12);
                    display: flex;
                    flex-direction: column;
                    transform: scale(0) translateY(20px);
                    opacity: 0;
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                    transform-origin: bottom right;
                    overflow: hidden;
                }

                .chatbot-window.open {
                    transform: scale(1) translateY(0);
                    opacity: 1;
                }

                .chatbot-window.minimized {
                    height: 60px;
                    overflow: hidden;
                }

                /* Header */
                .chatbot-header {
                    background: ${this.config.primaryColor};
                    color: white;
                    padding: 16px 20px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-shrink: 0;
                }

                .chatbot-header-info {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .chatbot-avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.2);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                }

                .chatbot-title {
                    font-weight: 600;
                    font-size: 16px;
                }

                .chatbot-status {
                    font-size: 12px;
                    opacity: 0.9;
                }

                .chatbot-header-actions {
                    display: flex;
                    gap: 8px;
                }

                .chatbot-header-btn {
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                    transition: background 0.2s;
                }

                .chatbot-header-btn:hover {
                    background: rgba(255,255,255,0.1);
                }

                /* Messages Area */
                .chatbot-messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    background: #f8f9fa;
                }

                .chatbot-message {
                    max-width: 80%;
                    word-wrap: break-word;
                    animation: chatbot-fade-in 0.3s ease;
                }

                .chatbot-message.bot {
                    align-self: flex-start;
                }

                .chatbot-message.user {
                    align-self: flex-end;
                }

                .chatbot-message-content {
                    padding: 12px 16px;
                    border-radius: 18px;
                    position: relative;
                }

                .chatbot-message.bot .chatbot-message-content {
                    background: white;
                    border: 1px solid #e1e5e9;
                }

                .chatbot-message.user .chatbot-message-content {
                    background: ${this.config.primaryColor};
                    color: white;
                }

                .chatbot-message-time {
                    font-size: 11px;
                    color: #8b95a1;
                    margin-top: 4px;
                    text-align: center;
                }

                /* Typing Indicator */
                .chatbot-typing {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 16px;
                    background: white;
                    border-radius: 18px;
                    align-self: flex-start;
                    border: 1px solid #e1e5e9;
                }

                .chatbot-typing-dots {
                    display: flex;
                    gap: 3px;
                }

                .chatbot-typing-dot {
                    width: 6px;
                    height: 6px;
                    background: #8b95a1;
                    border-radius: 50%;
                    animation: chatbot-typing-bounce 1.4s infinite;
                }

                .chatbot-typing-dot:nth-child(2) {
                    animation-delay: 0.2s;
                }

                .chatbot-typing-dot:nth-child(3) {
                    animation-delay: 0.4s;
                }

                @keyframes chatbot-typing-bounce {
                    0%, 60%, 100% { transform: translateY(0); }
                    30% { transform: translateY(-10px); }
                }

                /* Input Area */
                .chatbot-input-area {
                    padding: 16px 20px;
                    background: white;
                    border-top: 1px solid #e1e5e9;
                    flex-shrink: 0;
                }

                .chatbot-input-container {
                    display: flex;
                    align-items: flex-end;
                    gap: 8px;
                    background: #f8f9fa;
                    border-radius: 20px;
                    padding: 8px 12px;
                    border: 1px solid #e1e5e9;
                    transition: border-color 0.2s;
                }

                .chatbot-input-container:focus-within {
                    border-color: ${this.config.primaryColor};
                }

                .chatbot-input {
                    flex: 1;
                    border: none;
                    outline: none;
                    background: none;
                    resize: none;
                    font-family: inherit;
                    font-size: 14px;
                    line-height: 1.4;
                    max-height: 100px;
                    min-height: 20px;
                }

                .chatbot-send-btn {
                    background: ${this.config.primaryColor};
                    border: none;
                    color: white;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background 0.2s;
                    flex-shrink: 0;
                }

                .chatbot-send-btn:hover:not(:disabled) {
                    background: ${this.adjustColor(this.config.primaryColor, -20)};
                }

                .chatbot-send-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                /* Animations */
                @keyframes chatbot-fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                /* Mobile Responsive */
                @media (max-width: 480px) {
                    .chatbot-window {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        width: 100%;
                        height: 100%;
                        border-radius: 0;
                        transform: translateY(100%);
                    }

                    .chatbot-window.open {
                        transform: translateY(0);
                    }

                    .chatbot-toggle-btn {
                        width: 50px;
                        height: 50px;
                    }
                }

                /* Powered by */
                .chatbot-powered-by {
                    text-align: center;
                    padding: 8px;
                    font-size: 11px;
                    color: #8b95a1;
                    background: #f8f9fa;
                    border-top: 1px solid #e1e5e9;
                }

                .chatbot-powered-by a {
                    color: ${this.config.primaryColor};
                    text-decoration: none;
                }
            `;
            document.head.appendChild(style);
        }

        createWidget() {
            // Create container
            this.container = document.createElement('div');
            this.container.className = `chatbot-widget-container position-${this.config.position}`;

            // Create toggle button
            this.toggleBtn = document.createElement('button');
            this.toggleBtn.className = 'chatbot-toggle-btn';
            this.toggleBtn.innerHTML = `
                <svg class="chat-icon" viewBox="0 0 24 24">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                </svg>
                <svg class="close-icon" viewBox="0 0 24 24">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
            `;

            // Create unread badge
            this.unreadBadge = document.createElement('div');
            this.unreadBadge.className = 'chatbot-unread-badge';
            this.unreadBadge.style.display = 'none';
            this.toggleBtn.appendChild(this.unreadBadge);

            // Create chat window
            this.chatWindow = document.createElement('div');
            this.chatWindow.className = 'chatbot-window';
            this.chatWindow.innerHTML = this.getChatWindowHTML();

            // Add to container
            this.container.appendChild(this.toggleBtn);
            this.container.appendChild(this.chatWindow);

            // Add to page
            document.body.appendChild(this.container);

            // Get references to elements
            this.messagesContainer = this.chatWindow.querySelector('.chatbot-messages');
            this.input = this.chatWindow.querySelector('.chatbot-input');
            this.sendBtn = this.chatWindow.querySelector('.chatbot-send-btn');
        }

        getChatWindowHTML() {
            return `
                <div class="chatbot-header">
                    <div class="chatbot-header-info">
                        <div class="chatbot-avatar">🤖</div>
                        <div>
                            <div class="chatbot-title">${this.config.title}</div>
                            <div class="chatbot-status">Online</div>
                        </div>
                    </div>
                    <div class="chatbot-header-actions">
                        <button class="chatbot-header-btn chatbot-minimize-btn" title="Minimize">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 13H5v-2h14v2z"/>
                            </svg>
                        </button>
                        <button class="chatbot-header-btn chatbot-close-btn" title="Close">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div class="chatbot-messages">
                    <div class="chatbot-message bot">
                        <div class="chatbot-message-content">${this.config.greeting}</div>
                        <div class="chatbot-message-time">${this.getCurrentTime()}</div>
                    </div>
                </div>
                
                <div class="chatbot-input-area">
                    <div class="chatbot-input-container">
                        <textarea class="chatbot-input" placeholder="${this.config.placeholder}" rows="1"></textarea>
                        <button class="chatbot-send-btn" type="button">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div class="chatbot-powered-by">
                    Powered by <a href="https://your-domain.com" target="_blank">ChatBot Builder</a>
                </div>
            `;
        }

        bindEvents() {
            // Toggle button
            this.toggleBtn?.addEventListener('click', () => {
                if (this.isOpen) {
                    this.closeWidget();
                } else {
                    this.openWidget();
                }
            });

            // Close button
            this.chatWindow?.querySelector('.chatbot-close-btn')?.addEventListener('click', () => {
                this.closeWidget();
            });

            // Minimize button
            this.chatWindow?.querySelector('.chatbot-minimize-btn')?.addEventListener('click', () => {
                this.toggleMinimize();
            });

            // Send button
            this.sendBtn.addEventListener('click', () => {
                this.sendMessage();
            });

            // Input events
            this.input.addEventListener('keydown', (e: any) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            this.input.addEventListener('input', () => {
                this.autoResizeInput();
            });

            // Click outside to close (optional)
            document.addEventListener('click', (e: any) => {
                if (this.isOpen && !this.container?.contains(e.target)) {
                    // Optionally close on outside click
                    // this.closeWidget();
                }
            });
        }

        openWidget() {
            this.isOpen = true;
            this.chatWindow?.classList.add('open');
            this.toggleBtn?.classList.add('open');
            this.input.focus();
            this.clearUnreadCount();
        }

        closeWidget() {
            this.isOpen = false;
            this.isMinimized = false;
            this.chatWindow?.classList.remove('open', 'minimized');
            this.toggleBtn?.classList.remove('open');
        }

        toggleMinimize() {
            this.isMinimized = !this.isMinimized;
            this.chatWindow?.classList.toggle('minimized');
        }

        async sendMessage() {
            const message = this.input.value.trim();
            if (!message) return;

            // Add user message to UI
            this.addMessage(message, 'user');
            this.input.value = '';
            this.autoResizeInput();

            // Show typing indicator
            this.showTyping();

            try {
                // Send to API
                const response = await this.sendToAPI(message);

                // Hide typing indicator
                this.hideTyping();

                // Add bot response
                if (response.message) {
                    this.addMessage(response.message.content, 'bot');
                }
            } catch (error) {
                console.error('ChatBot: Failed to send message', error);
                this.hideTyping();
                this.addMessage('Sorry, something went wrong. Please try again.', 'bot');
            }
        }

        async sendToAPI(message: any) {
            const response = await fetch(`${this.config.apiUrl}/conversations/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chatbotId: this.config.chatbotId,
                    sessionId: this.sessionId,
                    message: message,
                    visitorInfo: this.visitorInfo,
                    metadata: {
                        url: window.location.href,
                        referrer: document.referrer,
                        timestamp: new Date().toISOString()
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            return await response.json();
        }

        addMessage(content: string, type: string) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `chatbot-message ${type}`;

            messageDiv.innerHTML = `
                <div class="chatbot-message-content">${this.escapeHtml(content)}</div>
                <div class="chatbot-message-time">${this.getCurrentTime()}</div>
            `;

            this.messagesContainer.appendChild(messageDiv);
            this.scrollToBottom();

            // Update unread count if widget is closed
            if (!this.isOpen && type === 'bot') {
                this.incrementUnreadCount();
            }
        }

        showTyping() {
            if (this.typingIndicator) return;

            this.typingIndicator = document.createElement('div');
            this.typingIndicator.className = 'chatbot-typing';
            this.typingIndicator.innerHTML = `
                <div class="chatbot-typing-dots">
                    <div class="chatbot-typing-dot"></div>
                    <div class="chatbot-typing-dot"></div>
                    <div class="chatbot-typing-dot"></div>
                </div>
                <span style="margin-left: 8px; color: #8b95a1; font-size: 12px;">Typing...</span>
            `;

            this.messagesContainer.appendChild(this.typingIndicator);
            this.scrollToBottom();
        }

        hideTyping() {
            if (this.typingIndicator) {
                this.typingIndicator.remove();
                this.typingIndicator = null;
            }
        }

        scrollToBottom() {
            setTimeout(() => {
                this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
            }, 100);
        }

        autoResizeInput() {
            this.input.style.height = 'auto';
            this.input.style.height = Math.min(this.input.scrollHeight, 100) + 'px';
        }

        incrementUnreadCount() {
            this.unreadCount++;
            this.updateUnreadBadge();
        }

        clearUnreadCount() {
            this.unreadCount = 0;
            this.updateUnreadBadge();
        }

        updateUnreadBadge() {
            if (this.unreadBadge) { // Check if unreadBadge is defined
                if (this.unreadCount > 0) {
                    this.unreadBadge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount.toString();
                    this.unreadBadge.style.display = 'flex';
                } else {
                    this.unreadBadge.style.display = 'none';
                }
            }
        }


        getCurrentTime() {
            return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        escapeHtml(text: string | null) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        adjustColor(color: string, amount: number) {
            const num = parseInt(color.replace('#', ''), 16);
            const amt = Math.round(2.55 * amount);
            const R = (num >> 16) + amt;
            const G = (num >> 8 & 0x00FF) + amt;
            const B = (num & 0x0000FF) + amt;
            return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
                (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
                (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
        }

        getVisitorInfo() {
            return {
                userAgent: navigator.userAgent,
                referrer: document.referrer,
                url: window.location.href,
                timestamp: new Date().toISOString(),
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                language: navigator.language,
                screenResolution: `${screen.width}x${screen.height}`,
                viewport: `${window.innerWidth}x${window.innerHeight}`
            };
        }

        initializeWebSocket() {
            // WebSocket implementation for real-time updates
            // This would connect to your Socket.io server
            // For now, we'll use polling as fallback
            // TODO: Implement WebSocket connection
        }

        // Public API methods
        open() {
            this.openWidget();
        }

        close() {
            this.closeWidget();
        }

        sendBotMessage(message: string) {
            this.addMessage(message, 'bot');
        }

        destroy() {
            if (this.container) {
                this.container.remove();
            }
        }
    }

    // Initialize widget when DOM is ready
    function initWidget() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                window.ChatBotBuilder = new ChatBotWidget(config);
            });
        } else {
            window.ChatBotBuilder = new ChatBotWidget(config);
        }
    }



    // Start initialization
    initWidget();

})();