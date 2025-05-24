'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

// Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayOptions {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  image?: string;
  handler: (response: any) => void;
  prefill: {
    name: string;
    email: string;
    contact?: string;
  };
  notes: Record<string, any>;
  theme: {
    color: string;
  };
  modal: {
    ondismiss: () => void;
  };
}

interface Plan {
  _id: string;
  name: string;
  tier: string;
  description: string;
  price: number;
  currency: string;
  interval: string;
  features: Array<{
    name: string;
    included: boolean;
  }>;
  limits: {
    chatbots: number;
    messagesPerMonth: number;
    apiCallsPerMonth: number;
    storageGB: number;
    customBranding: boolean;
    prioritySupport: boolean;
    analytics: boolean;
    aiIntegration: boolean;
  };
}

export default function RazorpayPayment() {
  const { data: session } = useSession();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [userSubscription, setUserSubscription] = useState<any>(null);

  useEffect(() => {
    fetchPlans();
    fetchSubscriptionStatus();
    loadRazorpayScript();
  }, []);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/plans');
      const data = await response.json();
      setPlans(data.plans || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch('/api/subscription/status');
      const data = await response.json();
      setUserSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const handleSubscribe = async (plan: Plan) => {
    if (!session?.user) {
      alert('Please login to subscribe');
      return;
    }

    setLoading(true);
    setSelectedPlan(plan);

    try {
      // Create subscription
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan._id,
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Initialize Razorpay
      const options: RazorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        subscription_id: data.subscription.id,
        name: 'Chatbot Builder',
        description: `${plan.name} Plan Subscription`,
        image: '/logo.png', // Your logo
        handler: handlePaymentSuccess,
        prefill: {
          name: session.user.name || '',
          email: session.user.email || '',
          contact: userSubscription?.user?.phone || '',
        },
        notes: {
          planId: plan._id,
          planTier: plan.tier,
        },
        theme: {
          color: '#007bff',
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setSelectedPlan(null);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error('Subscription error:', error);
      alert('Failed to create subscription. Please try again.');
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  const handlePaymentSuccess = async (response: any) => {
    try {
      // Confirm subscription
      const confirmResponse = await fetch('/api/subscription/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_subscription_id: response.razorpay_subscription_id,
          razorpay_signature: response.razorpay_signature,
        }),
      });

      const confirmData = await confirmResponse.json();
      
      if (confirmData.success) {
        alert('Subscription activated successfully!');
        fetchSubscriptionStatus(); // Refresh subscription status
      } else {
        throw new Error(confirmData.error);
      }

    } catch (error) {
      console.error('Payment confirmation error:', error);
      alert('Payment successful but confirmation failed. Please contact support.');
    } finally {
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: 'User requested cancellation',
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Subscription cancelled successfully. It will remain active until the end of current billing period.');
        fetchSubscriptionStatus();
      } else {
        throw new Error(data.error);
      }

    } catch (error) {
      console.error('Cancellation error:', error);
      alert('Failed to cancel subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
    }).format(price / 100); // Convert paisa to rupees
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-8">Choose Your Plan</h1>
      
      {/* Current Subscription Status */}
      {userSubscription?.subscription && (
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Current Subscription</h2>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">
                Plan: <span className="font-medium">{userSubscription.subscription.plan.name}</span>
              </p>
              <p className="text-sm text-gray-600">
                Status: <span className={`font-medium ${
                  userSubscription.subscription.status === 'active' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {userSubscription.subscription.status}
                </span>
              </p>
              <p className="text-sm text-gray-600">
                Next billing: {new Date(userSubscription.subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            </div>
            {userSubscription.subscription.status === 'active' && (
              <button
                onClick={handleCancelSubscription}
                disabled={loading}
                className="px-4 py-2 text-sm text-red-600 border border-red-600 rounded-md hover:bg-red-50 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Cancel Subscription'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Usage Statistics */}
      {userSubscription?.user && (
        <div className="mb-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Current Usage</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Chatbots</p>
              <p className="text-xl font-bold">{userSubscription.user.usage.chatbots}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Messages this month</p>
              <p className="text-xl font-bold">{userSubscription.user.usage.monthlyMessages}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">API Calls</p>
              <p className="text-xl font-bold">{userSubscription.user.usage.apiCalls}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Storage (MB)</p>
              <p className="text-xl font-bold">{userSubscription.user.usage.storage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan._id}
            className={`border rounded-lg p-6 ${
              plan.tier === 'pro' ? 'border-blue-500 relative' : 'border-gray-200'
            }`}
          >
            {plan.tier === 'pro' && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
                  Most Popular
                </span>
              </div>
            )}
            
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <p className="text-gray-600 text-sm mt-2">{plan.description}</p>
            </div>

            <div className="text-center mb-6">
              <div className="text-3xl font-bold">
                {plan.price === 0 ? 'Free' : formatPrice(plan.price)}
              </div>
              {plan.price > 0 && (
                <div className="text-sm text-gray-600">per {plan.interval}</div>
              )}
            </div>

            <ul className="space-y-2 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center text-sm">
                  <span className={`mr-2 ${feature.included ? 'text-green-500' : 'text-gray-400'}`}>
                    {feature.included ? '✓' : '×'}
                  </span>
                  {feature.name}
                </li>
              ))}
            </ul>

            <div className="space-y-2 mb-6 text-sm text-gray-600">
              <p>• {plan.limits.chatbots === -1 ? 'Unlimited' : plan.limits.chatbots} Chatbots</p>
              <p>• {plan.limits.messagesPerMonth === -1 ? 'Unlimited' : plan.limits.messagesPerMonth.toLocaleString()} Messages/month</p>
              <p>• {plan.limits.storageGB} GB Storage</p>
              {plan.limits.customBranding && <p>• Custom Branding</p>}
              {plan.limits.prioritySupport && <p>• Priority Support</p>}
              {plan.limits.analytics && <p>• Advanced Analytics</p>}
              {plan.limits.aiIntegration && <p>• AI Integration</p>}
            </div>

            <button
              onClick={() => handleSubscribe(plan)}
              disabled={loading || (userSubscription?.user?.subscription?.tier === plan.tier)}
              className={`w-full py-2 px-4 rounded-md font-medium ${
                userSubscription?.user?.subscription?.tier === plan.tier
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : plan.tier === 'pro'
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-800 text-white hover:bg-gray-900'
              } disabled:opacity-50`}
            >
              {loading && selectedPlan?._id === plan._id
                ? 'Processing...'
                : userSubscription?.user?.subscription?.tier === plan.tier
                ? 'Current Plan'
                : plan.price === 0
                ? 'Get Started'
                : 'Subscribe Now'
              }
            </button>
          </div>
        ))}
      </div>

      {/* Payment Security Note */}
      <div className="mt-8 text-center text-sm text-gray-600">
        <p>🔒 Payments are processed securely by Razorpay</p>
        <p>All major payment methods accepted including UPI, Cards, Net Banking</p>
      </div>
    </div>
  );
}