import { useEffect, useState } from "react";

export function useChatBotWidget() {
  const [widget, setWidget] = useState<any>(null);

  useEffect(() => {
    const handleReady = (e: CustomEvent) => {
      setWidget(e.detail.widget);
    };

    window.addEventListener('chatbot-ready', handleReady as EventListener);
    
    return () => {
      window.removeEventListener('chatbot-ready', handleReady as EventListener);
    };
  }, []);

  return {
    widget,
    isReady: !!widget,
    open: () => widget?.open(),
    close: () => widget?.close(),
    sendMessage: (message: string) => widget?.sendBotMessage(message),
    setUserData: (data: any) => widget?.setUserData(data),
  };
}