import { SubscriptionService } from '@/lib/database-utils';
import connectDB from '@/lib/mongoose';
import RazorpayService from '@/lib/razorpay';
import { Subscription } from '@/models/subscription';
import { User } from '@/models/user';
import { headers } from 'next/headers';
import { NextRequest,NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature found' }, { status: 400 });
    }

    // Verify webhook signature
    const isValid = RazorpayService.verifyWebhookSignature(
      body,
      signature,
      process.env.RAZORPAY_WEBHOOK_SECRET!
    );

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);
    await handleRazorpayWebhook(event);

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Razorpay webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleRazorpayWebhook(event: any) {
  const { entity, event: eventType } = event;

  switch (eventType) {
    case 'subscription.authenticated':
      await handleSubscriptionAuthenticated(entity);
      break;
    
    case 'subscription.activated':
      await handleSubscriptionActivated(entity);
      break;
    
    case 'subscription.charged':
      await handleSubscriptionCharged(entity);
      break;
    
    case 'subscription.completed':
      await handleSubscriptionCompleted(entity);
      break;
    
    case 'subscription.updated':
      await handleSubscriptionUpdated(entity);
      break;
    
    case 'subscription.paused':
      await handleSubscriptionPaused(entity);
      break;
    
    case 'subscription.resumed':
      await handleSubscriptionResumed(entity);
      break;
    
    case 'subscription.cancelled':
      await handleSubscriptionCancelled(entity);
      break;
    
    case 'payment.authorized':
      await handlePaymentAuthorized(entity);
      break;
    
    case 'payment.captured':
      await handlePaymentCaptured(entity);
      break;
    
    case 'payment.failed':
      await handlePaymentFailed(entity);
      break;
    
    default:
      console.log(`Unhandled event type: ${eventType}`);
  }
}

async function handleSubscriptionAuthenticated(subscription: any) {
  await SubscriptionService.updateSubscriptionStatus(
    subscription.id,
    'authenticated'
  );
}

async function handleSubscriptionActivated(subscription: any) {
  await SubscriptionService.updateSubscriptionStatus(
    subscription.id,
    'active'
  );
}

async function handleSubscriptionCharged(subscription: any) {
  await connectDB();
  
  // Update subscription status and period
  await Subscription.findOneAndUpdate(
    { razorpaySubscriptionId: subscription.id },
    {
      $set: {
        status: 'active',
        currentPeriodStart: new Date(subscription.current_start * 1000),
        currentPeriodEnd: new Date(subscription.current_end * 1000),
        'billing.lastPaymentDate': new Date(),
        'billing.failedPaymentAttempts': 0
      }
    }
  );

  // Reset monthly usage if needed
  const subscriptionDoc = await Subscription.findOne({ 
    razorpaySubscriptionId: subscription.id 
  });
  
  if (subscriptionDoc) {
    const user = await User.findById(subscriptionDoc.userId);
    if (user) {
      const now = new Date();
      const lastReset = user.usage.lastResetDate;
      
      // Reset if it's a new month
      if (lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
        await User.findByIdAndUpdate(user._id, {
          $set: {
            'usage.monthlyMessages': 0,
            'usage.lastResetDate': now
          }
        });
      }
    }
  }
}

async function handleSubscriptionCompleted(subscription: any) {
  await SubscriptionService.updateSubscriptionStatus(
    subscription.id,
    'completed'
  );
}

async function handleSubscriptionUpdated(subscription: any) {
  await connectDB();
  
  await Subscription.findOneAndUpdate(
    { razorpaySubscriptionId: subscription.id },
    {
      $set: {
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_start * 1000),
        currentPeriodEnd: new Date(subscription.current_end * 1000)
      }
    }
  );
}

async function handleSubscriptionPaused(subscription: any) {
  await SubscriptionService.updateSubscriptionStatus(
    subscription.id,
    'paused'
  );
}

async function handleSubscriptionResumed(subscription: any) {
  await SubscriptionService.updateSubscriptionStatus(
    subscription.id,
    'active'
  );
}

async function handleSubscriptionCancelled(subscription: any) {
  await SubscriptionService.updateSubscriptionStatus(
    subscription.id,
    'cancelled'
  );
}

async function handlePaymentAuthorized(payment: any) {
  console.log('Payment authorized:', payment.id);
  // Handle payment authorization if needed
}

async function handlePaymentCaptured(payment: any) {
  console.log('Payment captured:', payment.id);
  
  // Update subscription payment info
  if (payment.subscription_id) {
    await connectDB();
    
    await Subscription.findOneAndUpdate(
      { razorpaySubscriptionId: payment.subscription_id },
      {
        $set: {
          'billing.lastPaymentDate': new Date(payment.created_at * 1000),
          'billing.lastPaymentAmount': payment.amount
        }
      }
    );
  }
}

async function handlePaymentFailed(payment: any) {
  console.log('Payment failed:', payment.id);
  
  if (payment.subscription_id) {
    await connectDB();
    
    await Subscription.findOneAndUpdate(
      { razorpaySubscriptionId: payment.subscription_id },
      {
        $inc: { 'billing.failedPaymentAttempts': 1 },
        $set: { status: 'past_due' }
      }
    );
  }
}