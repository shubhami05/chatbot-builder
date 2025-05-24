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
    
    const { reason } = await request.json();
    
    // Get user
    const user = await User.findOne({ email: session.user.email });
    if (!user || !user.subscription.razorpaySubscriptionId) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    // Cancel subscription in Razorpay
    const cancelledSubscription = await RazorpayService.cancelSubscription(
      user.subscription.razorpaySubscriptionId,
      true // cancel at cycle end
    );

    // Update subscription in database
    await SubscriptionService.cancelSubscription(
      user.subscription.razorpaySubscriptionId,
      reason
    );

    return NextResponse.json({
      success: true,
      subscription: cancelledSubscription
    });

  } catch (error) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}