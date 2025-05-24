import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

export function useSubscription() {
  const { data: session, update } = useSession();
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchSubscriptionData = async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    try {
      const response = await fetch('/api/subscription/status');
      const data = await response.json();
      setSubscriptionData(data);
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionData();
  }, [session?.user?.id]);

  const refreshSubscription = async () => {
    await fetchSubscriptionData();
    // Update the session to reflect new subscription status
    await update();
  };

  const hasFeature = (feature: string): boolean => {
    if (!session?.user?.subscription) return false;
    
    const { tier } = session.user.subscription;
    
    // Define feature access by tier
    const features: Record<string, string[]> = {
      free: ['basic_chatbot', 'basic_analytics'],
      pro: ['basic_chatbot', 'basic_analytics', 'advanced_analytics', 'custom_branding', 'ai_integration', 'webhook_integration'],
      enterprise: ['basic_chatbot', 'basic_analytics', 'advanced_analytics', 'custom_branding', 'ai_integration', 'webhook_integration', 'white_label', 'priority_support', 'custom_integrations']
    };

    return features[tier]?.includes(feature) || false;
  };

  const canCreateChatbot = (): boolean => {
    if (!subscriptionData?.user?.usage) return false;
    
    const { subscription, usage } = subscriptionData.user;
    const limits = subscriptionData.subscription?.plan?.limits;
    
    if (!limits) return false;
    
    return limits.chatbots === -1 || usage.chatbots < limits.chatbots;
  };

  const canSendMessage = (): boolean => {
    if (!subscriptionData?.user?.usage) return false;
    
    const { usage } = subscriptionData.user;
    const limits = subscriptionData.subscription?.plan?.limits;
    
    if (!limits) return false;
    
    return limits.messagesPerMonth === -1 || usage.monthlyMessages < limits.messagesPerMonth;
  };

  return {
    subscription: session?.user?.subscription,
    subscriptionData,
    loading,
    hasFeature,
    canCreateChatbot,
    canSendMessage,
    refreshSubscription,
  };
}
