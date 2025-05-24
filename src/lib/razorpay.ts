// lib/razorpay.ts
import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export interface RazorpayPlan {
    id: string;
    entity: string;
    item: {
        id: string;
        name: string;
        description: string;
        amount: number;
        currency: string;
    };
    period: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    notes: Record<string, any>;
    created_at: number;
}

export interface RazorpaySubscription {
    id: string;
    entity: string;
    plan_id: string;
    customer_id: string;
    status: 'created' | 'authenticated' | 'active' | 'paused' | 'halted' | 'cancelled' | 'completed' | 'expired';
    current_start: number;
    current_end: number;
    ended_at?: number;
    quantity: number;
    notes: Record<string, any>;
    charge_at: number;
    start_at: number;
    end_at: number;
    auth_attempts: number;
    total_count: number;
    paid_count: number;
    customer_notify: boolean;
    created_at: number;
    expire_by: number;
    short_url: string;
    has_scheduled_changes: boolean;
    change_scheduled_at?: number;
}

export interface RazorpayCustomer {
    id: string;
    entity: string;
    name: string;
    email: string;
    contact: string;
    gstin?: string;
    notes: Record<string, any>;
    created_at: number;
}

export interface RazorpayPayment {
    id: string;
    entity: string;
    amount: number;
    currency: string;
    status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';
    order_id?: string;
    invoice_id?: string;
    international: boolean;
    method: 'card' | 'netbanking' | 'wallet' | 'emi' | 'upi';
    amount_refunded: number;
    captured: boolean;
    description?: string;
    card_id?: string;
    bank?: string;
    wallet?: string;
    vpa?: string;
    email: string;
    contact: string;
    notes: Record<string, any>;
    fee?: number;
    tax?: number;
    error_code?: string;
    error_description?: string;
    error_source?: string;
    error_step?: string;
    error_reason?: string;
    acquirer_data: Record<string, any>;
    created_at: number;
}

export class RazorpayService {
    // Create a customer
    static async createCustomer(customerData: {
        name: string;
        email: string;
        contact: string;
        notes?: Record<string, any>;
    }): Promise<RazorpayCustomer> {
        try {
            const customer = await razorpay.customers.create(customerData) as RazorpayCustomer;
            return customer;
        } catch (error) {
            console.error('Error creating Razorpay customer:', error);
            throw new Error('Failed to create customer');
        }
    }

    // Get customer by ID
    static async getCustomer(customerId: string): Promise<RazorpayCustomer> {
        try {
            const customer = await razorpay.customers.fetch(customerId) as RazorpayCustomer;
            return customer;
        } catch (error) {
            console.error('Error fetching Razorpay customer:', error);
            throw new Error('Failed to fetch customer');
        }
    }

    // Update customer
    static async updateCustomer(customerId: string, updateData: {
        name?: string;
        email?: string;
        contact?: string;
        notes?: Record<string, any>;
    }): Promise<RazorpayCustomer> {
        try {
            const customer = await razorpay.customers.edit(customerId, updateData) as RazorpayCustomer;
            return customer;
        } catch (error) {
            console.error('Error updating Razorpay customer:', error);
            throw new Error('Failed to update customer');
        }
    }

    // Create a plan
    static async createPlan(planData: {
        period: 'daily' | 'weekly' | 'monthly' | 'yearly';
        interval: number;
        item: {
            name: string;
            description: string;
            amount: number; // in paisa (₹1 = 100 paisa)
            currency: string;
        };
        notes?: Record<string, any>;
    }): Promise<RazorpayPlan> {
        try {
            const plan = await razorpay.plans.create(planData) as RazorpayPlan;
            return plan;
        } catch (error) {
            console.error('Error creating Razorpay plan:', error);
            throw new Error('Failed to create plan');
        }
    }

    // Get plan by ID
    static async getPlan(planId: string): Promise<RazorpayPlan> {
        try {
            const plan = await razorpay.plans.fetch(planId) as RazorpayPlan;
            return plan;
        } catch (error) {
            console.error('Error fetching Razorpay plan:', error);
            throw new Error('Failed to fetch plan');
        }
    }

    // Create a subscription
    static async createSubscription(subscriptionData: {
        plan_id: string;
        customer_id: string;
        quantity?: number;
        total_count: number;
        start_at?: number;
        expire_by?: number;
        customer_notify?: boolean;
        addons?: Array<{
            item: {
                name: string;
                amount: number;
                currency: string;
            };
        }>;
        notes?: Record<string, any>;
        notify_info?: {
            notify_phone?: string;
            notify_email?: string;
        };
    }): Promise<RazorpaySubscription> {
        try {
            const subscription = await razorpay.subscriptions.create(subscriptionData) as unknown as RazorpaySubscription;
            return subscription;
        } catch (error) {
            console.error('Error creating Razorpay subscription:', error);
            throw new Error('Failed to create subscription');
        }
    }

    // Get subscription by ID
    static async getSubscription(subscriptionId: string): Promise<RazorpaySubscription> {
        try {
            const subscription = await razorpay.subscriptions.fetch(subscriptionId) as RazorpaySubscription;
            return subscription;
        } catch (error) {
            console.error('Error fetching Razorpay subscription:', error);
            throw new Error('Failed to fetch subscription');
        }
    }

    // Update subscription
    static async updateSubscription(subscriptionId: string, updateData: {
        plan_id?: string;
        quantity?: number;
        remaining_count?: number;
        schedule_change_at?: 'now' | 'cycle_end';
        customer_notify?: boolean;
        notes?: Record<string, any>;
    }): Promise<RazorpaySubscription> {
        try {
            const subscription = await razorpay.subscriptions.update(subscriptionId, updateData) as unknown as RazorpaySubscription;
            return subscription;
        } catch (error) {
            console.error('Error updating Razorpay subscription:', error);
            throw new Error('Failed to update subscription');
        }
    }

    // Cancel subscription
    static async cancelSubscription(subscriptionId: string, cancelAtCycleEnd: boolean = false): Promise<RazorpaySubscription> {
        try {
            const subscription = razorpay.subscriptions.cancel(subscriptionId, cancelAtCycleEnd);
            return subscription as unknown as RazorpaySubscription;
        } catch (error) {
            console.error('Error cancelling Razorpay subscription: ', error);
            throw new Error('Failed to cancel subscription');
        }
    }

    // Pause subscription
    static async pauseSubscription(subscriptionId: string, pauseAt: "now" | "cycle_end" = "now"): Promise<RazorpaySubscription> {
        try {
            const subscription = razorpay.subscriptions.pause(subscriptionId, {
                pause_at: "now"
            });
            return subscription as unknown as RazorpaySubscription;
        } catch (error) {
            console.error('Error pausing Razorpay subscription:', error);
            throw new Error('Failed to pause subscription');
        }
    }

    // Resume subscription
    static async resumeSubscription(subscriptionId: string, resumeAt: "now" | "cycle_end" = "now"): Promise<RazorpaySubscription> {
        try {
            const subscription = razorpay.subscriptions.resume(subscriptionId, {
                resume_at: "now"
            });
            return subscription as unknown as RazorpaySubscription;
        } catch (error) {
            console.error('Error resuming Razorpay subscription:', error);
            throw new Error('Failed to resume subscription');
        }
    }

    // Get subscription payments
    static async getSubscriptionPayments(subscriptionId: string): Promise<{ payments: RazorpayPayment[] }> {
        try {
            const payments = await razorpay.subscriptions.fetchPayments(subscriptionId) ;
            return payments;
        } catch (error) {
            console.error('Error fetching subscription payments:', error);
            throw new Error('Failed to fetch subscription payments');
        }
    }

    // Create order for one-time payments
    static async createOrder(orderData: {
        amount: number; // in paisa
        currency: string;
        receipt: string;
        notes?: Record<string, any>;
    }) {
        try {
            const order = await razorpay.orders.create(orderData);
            return order;
        } catch (error) {
            console.error('Error creating Razorpay order:', error);
            throw new Error('Failed to create order');
        }
    }

    // Verify payment signature
    static verifyPaymentSignature(
        orderId: string,
        paymentId: string,
        signature: string
    ): boolean {
        try {
            const body = orderId + '|' + paymentId;
            const expectedSignature = crypto
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
                .update(body.toString())
                .digest('hex');

            return expectedSignature === signature;
        } catch (error) {
            console.error('Error verifying payment signature:', error);
            return false;
        }
    }

    // Verify webhook signature
    static verifyWebhookSignature(
        body: string,
        signature: string,
        secret: string
    ): boolean {
        try {
            const expectedSignature = crypto
                .createHmac('sha256', secret)
                .update(body)
                .digest('hex');

            return expectedSignature === signature;
        } catch (error) {
            console.error('Error verifying webhook signature:', error);
            return false;
        }
    }

    // Get all payments
    static async getPayments(options: {
        count?: number;
        skip?: number;
        from?: number;
        to?: number;
    } = {}) {
        try {
            const payments = await razorpay.payments.all(options);
            return payments;
        } catch (error) {
            console.error('Error fetching payments:', error);
            throw new Error('Failed to fetch payments');
        }
    }

    // Get payment by ID
    static async getPayment(paymentId: string): Promise<RazorpayPayment> {
        try {
            const payment = await razorpay.payments.fetch(paymentId);
            return payment as RazorpayPayment;
        } catch (error) {
            console.error('Error fetching payment:', error);
            throw new Error('Failed to fetch payment');
        }
    }

    // Capture payment
    static async capturePayment(paymentId: string, amount: number, currency: string = 'INR') {
        try {
            const payment = await razorpay.payments.capture(paymentId, amount, currency);
            return payment;
        } catch (error) {
            console.error('Error capturing payment:', error);
            throw new Error('Failed to capture payment');
        }
    }

    // Refund payment
    static async refundPayment(paymentId: string, options: {
        amount?: number;
        speed?: 'normal' | 'optimum';
        notes?: Record<string, any>;
        receipt?: string;
    } = {}) {
        try {
            const refund = await razorpay.payments.refund(paymentId, options);
            return refund;
        } catch (error) {
            console.error('Error refunding payment:', error);
            throw new Error('Failed to refund payment');
        }
    }

    // Create addon for subscription
    static async createAddon(subscriptionId: string, addonData: {
        item: {
            name: string;
            amount: number;
            currency: string;
            description?: string;
        };
        quantity?: number;
    }) {
        try {
            const addon = await razorpay.subscriptions.createAddon(subscriptionId, addonData);
            return addon;
        } catch (error) {
            console.error('Error creating addon:', error);
            throw new Error('Failed to create addon');
        }
    }

    // Helper method to convert amount to paisa
    static toPaisa(amount: number): number {
        return Math.round(amount * 100);
    }

    // Helper method to convert paisa to rupees
    static toRupees(paisa: number): number {
        return paisa / 100;
    }

    // Helper method to format currency
    static formatCurrency(amount: number, currency: string = 'INR'): string {
        const rupees = this.toRupees(amount);
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: currency,
        }).format(rupees);
    }
}

// Export the razorpay instance for direct use if needed
export { razorpay };
export default RazorpayService;