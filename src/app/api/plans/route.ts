import connectDB from "@/lib/mongoose";
import { PricingPlan } from "@/models/pricingplan";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    
    const plans = await PricingPlan.find({ isActive: true })
      .sort({ sortOrder: 1, price: 1 });
    
    return NextResponse.json({ plans });
    
  } catch (error) {
    console.error('Get plans error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}
