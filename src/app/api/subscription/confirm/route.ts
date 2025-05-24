import { SubscriptionService } from "@/lib/database-utils";
import connectDB from "@/lib/mongoose";
import RazorpayService from "@/lib/razorpay";
import { User } from "@/models/user";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = await request.json();
    
    // Verify payment signature
    const isValid = RazorpayService.verifyPaymentSignature(
      razorpay_subscription_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Get subscription details from Razorpay
    const razorpaySubscription = await RazorpayService.getSubscription(razorpay_subscription_id);
    
    // Get user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create subscription in database
    const subscription = await SubscriptionService.createSubscription({
      userId: user._id,
      razorpaySubscriptionId: razorpaySubscription.id,
      razorpayCustomerId: razorpaySubscription.customer_id,
      razorpayPlanId: razorpaySubscription.plan_id,
      status: razorpaySubscription.status,
      currentPeriodStart: new Date(razorpaySubscription.current_start * 1000),
      currentPeriodEnd: new Date(razorpaySubscription.current_end * 1000)
    });

    return NextResponse.json({
      success: true,
      subscription
    });

  } catch (error) {
    console.error('Confirm subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to confirm subscription' },
      { status: 500 }
    );
  }
}
