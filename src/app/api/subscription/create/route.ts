import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongoose';
import { User } from '@/models/user';
import { PricingPlan } from '@/models/pricingplan';
import RazorpayService from '@/lib/razorpay';
import { SubscriptionService } from '@/lib/database-utils';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const { planId } = await request.json();
    
    // Get user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get pricing plan
    const plan = await PricingPlan.findById(planId);
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Create or get Razorpay customer
    let razorpayCustomer;
    if (user.subscription.razorpayCustomerId) {
      razorpayCustomer = await RazorpayService.getCustomer(user.subscription.razorpayCustomerId);
    } else {
      razorpayCustomer = await RazorpayService.createCustomer({
        name: user.name,
        email: user.email,
        contact: user.phone || '+91' + Math.floor(Math.random() * 9000000000 + 1000000000), // Fallback phone
        notes: {
          userId: user._id.toString()
        }
      });

      // Update user with customer ID
      await User.findByIdAndUpdate(user._id, {
        'subscription.razorpayCustomerId': razorpayCustomer.id
      });
    }

    // Create subscription
    const subscriptionData = {
      plan_id: plan.razorpayPlanId,
      customer_id: razorpayCustomer.id,
      quantity: 1,
      total_count: plan.interval === 'year' ? 12 : 120, // 1 year or 10 years worth
      customer_notify: true,
      notes: {
        userId: user._id.toString(),
        planTier: plan.tier
      }
    };

    const razorpaySubscription = await RazorpayService.createSubscription(subscriptionData);

    return NextResponse.json({
      subscription: razorpaySubscription,
      customer: razorpayCustomer
    });

  } catch (error) {
    console.error('Create subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
