import { SubscriptionService } from "@/lib/database-utils";
import connectDB from "@/lib/mongoose";
import RazorpayService from "@/lib/razorpay";
import { Subscription } from "@/models/subscription";
import { User } from "@/models/user";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let subscription = null;
    if (user.subscription.razorpaySubscriptionId) {
      subscription = await Subscription.findOne({
        razorpaySubscriptionId: user.subscription.razorpaySubscriptionId
      });

      // Also fetch latest status from Razorpay
      const razorpaySubscription = await RazorpayService.getSubscription(
        user.subscription.razorpaySubscriptionId
      );

      // Update local status if different
      if (subscription && subscription.status !== razorpaySubscription.status) {
        await SubscriptionService.updateSubscriptionStatus(
          user.subscription.razorpaySubscriptionId,
          razorpaySubscription.status
        );
        subscription.status = razorpaySubscription.status;
      }
    }

    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscription: user.subscription,
        usage: user.usage
      },
      subscription
    });

  } catch (error) {
    console.error('Get subscription status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    );
  }
}