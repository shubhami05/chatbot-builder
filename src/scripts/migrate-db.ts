// scripts/migrate-db.ts
import connectDB from "@/lib/mongoose";
import { PricingPlan } from "@/models/pricingplan";

async function createInitialPricingPlans() {
  await connectDB();
  
  const plans = [
    {
      name: 'Free',
      tier: 'free',
      description: 'Perfect for trying out our chatbot builder',
      price: 0,
      currency: 'usd',
      interval: 'month',
      razorpayPlanId: 'plan_free', // You'll get this from Razorpay
      razorpayProductId: 'prod_free',
      features: [
        { name: '1 Chatbot', included: true },
        { name: '100 Messages/month', included: true },
        { name: 'Basic Analytics', included: true },
        { name: 'Email Support', included: false },
        { name: 'Custom Branding', included: false },
        { name: 'AI Integration', included: false }
      ],
      limits: {
        chatbots: 1,
        messagesPerMonth: 100,
        apiCallsPerMonth: 1000,
        storageGB: 0.1,
        teamMembers: 1,
        customBranding: false,
        prioritySupport: false,
        analytics: true,
        aiIntegration: false,
        whiteLabel: false
      },
      sortOrder: 1
    },
    {
      name: 'Pro',
      tier: 'pro',
      description: 'For growing businesses and advanced features',
      price: 2900, // $29.00 in cents
      currency: 'usd',
      interval: 'month',
      razorpayPlanId: 'plan_pro_monthly',
      razorpayProductId: 'prod_pro',
      features: [
        { name: '10 Chatbots', included: true },
        { name: '10,000 Messages/month', included: true },
        { name: 'Advanced Analytics', included: true },
        { name: 'Priority Email Support', included: true },
        { name: 'Custom Branding', included: true },
        { name: 'AI Integration', included: true },
        { name: 'Webhook Integration', included: true },
        { name: 'File Upload Support', included: true }
      ],
      limits: {
        chatbots: 10,
        messagesPerMonth: 10000,
        apiCallsPerMonth: 50000,
        storageGB: 5,
        teamMembers: 5,
        customBranding: true,
        prioritySupport: true,
        analytics: true,
        aiIntegration: true,
        whiteLabel: false
      },
      sortOrder: 2
    },
    {
      name: 'Pro Annual',
      tier: 'pro',
      description: 'Pro plan billed annually (save 20%)',
      price: 23200, // $232.00 for annual (20% discount)
      currency: 'usd',
      interval: 'year',
      razorpayPlanId: 'plan_pro_yearly',
      razorpayProductId: 'prod_pro',
      features: [
        { name: '10 Chatbots', included: true },
        { name: '10,000 Messages/month', included: true },
        { name: 'Advanced Analytics', included: true },
        { name: 'Priority Email Support', included: true },
        { name: 'Custom Branding', included: true },
        { name: 'AI Integration', included: true },
        { name: 'Webhook Integration', included: true },
        { name: 'File Upload Support', included: true },
        { name: '2 Months Free', included: true }
      ],
      limits: {
        chatbots: 10,
        messagesPerMonth: 10000,
        apiCallsPerMonth: 50000,
        storageGB: 5,
        teamMembers: 5,
        customBranding: true,
        prioritySupport: true,
        analytics: true,
        aiIntegration: true,
        whiteLabel: false
      },
      sortOrder: 3
    },
    {
      name: 'Enterprise',
      tier: 'enterprise',
      description: 'For large organizations with custom needs',
      price: 9900, // $99.00
      currency: 'usd',
      interval: 'month',
      razorpayPlanId: 'plan_enterprise_monthly',
      razorpayProductId: 'prod_enterprise',
      features: [
        { name: 'Unlimited Chatbots', included: true },
        { name: 'Unlimited Messages', included: true },
        { name: 'Advanced Analytics & Reports', included: true },
        { name: 'Dedicated Support Manager', included: true },
        { name: 'White Label Solution', included: true },
        { name: 'Advanced AI Integration', included: true },
        { name: 'Custom Integrations', included: true },
        { name: 'SSO & Advanced Security', included: true },
        { name: 'API Access', included: true },
        { name: 'Custom Training', included: true }
      ],
      limits: {
        chatbots: -1, // unlimited
        messagesPerMonth: -1, // unlimited
        apiCallsPerMonth: -1, // unlimited
        storageGB: 100,
        teamMembers: -1, // unlimited
        customBranding: true,
        prioritySupport: true,
        analytics: true,
        aiIntegration: true,
        whiteLabel: true
      },
      sortOrder: 4
    }
  ];
  
  // Clear existing plans and insert new ones
  await PricingPlan.deleteMany({});
  
  for (const planData of plans) {
    const plan = new PricingPlan(planData);
    await plan.save();
    console.log(`Created pricing plan: ${plan.name} (${plan.tier})`);
  }
  
  console.log('✅ Pricing plans created successfully');
}

async function createIndexes() {
  await connectDB();
  
  try {
    // This will create all the indexes defined in the schemas
    console.log('Creating database indexes...');
    
    // The indexes are automatically created when the models are first used
    // But we can explicitly ensure they exist
    const { User, Chatbot, Conversation, Subscription, PricingPlan } = require('../models');
    
    await Promise.all([
      User.createIndexes(),
      Chatbot.createIndexes(),
      Conversation.createIndexes(),
      Subscription.createIndexes(),
      PricingPlan.createIndexes()
    ]);
    
    console.log('✅ Database indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
  }
}

async function seedDevelopmentData() {
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️  Skipping seed data in production');
    return;
  }
  
  await connectDB();
  
  const { User, Chatbot } = require('../models');
  
  // Create a test user
  const existingUser = await User.findOne({ email: 'test@example.com' });
  if (!existingUser) {
    const testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: '$2a$10$example.hash.for.testing', // In real app, hash the password
      emailVerified: true,
      subscription: {
        tier: 'pro',
        status: 'active'
      }
    });
    await testUser.save();
    console.log('✅ Test user created: test@example.com');
    
    // Create a sample chatbot
    const testChatbot = new Chatbot({
      userId: testUser._id,
      name: 'Demo Support Bot',
      description: 'A sample customer support chatbot',
      config: {
        greeting: 'Hello! Welcome to our demo chatbot. How can I help you today?',
        fallbackMessage: 'I\'m sorry, I didn\'t understand that. Could you please try rephrasing your question?',
        collectEmail: true,
        businessHours: {
          enabled: true,
          timezone: 'America/New_York',
          schedule: [
            { day: 1, start: '09:00', end: '17:00', isOpen: true }, // Monday
            { day: 2, start: '09:00', end: '17:00', isOpen: true }, // Tuesday
            { day: 3, start: '09:00', end: '17:00', isOpen: true }, // Wednesday
            { day: 4, start: '09:00', end: '17:00', isOpen: true }, // Thursday
            { day: 5, start: '09:00', end: '17:00', isOpen: true }, // Friday
            { day: 6, start: '10:00', end: '14:00', isOpen: true }, // Saturday
            { day: 0, start: '00:00', end: '00:00', isOpen: false } // Sunday
          ],
          outsideHoursMessage: 'Thanks for your message! Our team is currently offline. We\'ll get back to you during business hours (Mon-Fri 9AM-5PM EST).'
        }
      },
      knowledgeBase: [
        {
          id: 'kb_1',
          question: 'What are your business hours?',
          answer: 'We\'re open Monday through Friday from 9 AM to 5 PM EST, and Saturday from 10 AM to 2 PM EST.',
          keywords: ['hours', 'open', 'time', 'when'],
          category: 'General',
          isActive: true,
          confidence: 1.0
        },
        {
          id: 'kb_2',
          question: 'How can I contact support?',
          answer: 'You can contact our support team through this chat, email us at support@example.com, or call us at (555) 123-4567.',
          keywords: ['contact', 'support', 'help', 'phone', 'email'],
          category: 'Support',
          isActive: true,
          confidence: 1.0
        },
        {
          id: 'kb_3',
          question: 'What payment methods do you accept?',
          answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers.',
          keywords: ['payment', 'pay', 'credit card', 'paypal', 'billing'],
          category: 'Billing',
          isActive: true,
          confidence: 1.0
        }
      ],
      flows: [
        {
          id: 'flow_welcome',
          name: 'Welcome Flow',
          description: 'Initial greeting and menu options',
          isActive: true,
          trigger: {
            type: 'keyword',
            value: 'start'
          },
          nodes: [
            {
              id: 'node_1',
              type: 'message',
              position: { x: 100, y: 100 },
              content: {
                text: 'Hi there! 👋 I\'m your virtual assistant. I can help you with:',
                buttons: [
                  { text: '💰 Pricing Info', value: 'pricing', action: 'reply' },
                  { text: '🔧 Technical Support', value: 'support', action: 'reply' },
                  { text: '📞 Contact Us', value: 'contact', action: 'reply' }
                ]
              },
              connections: ['node_2']
            }
          ]
        }
      ]
    });
    
    await testChatbot.save();
    console.log('✅ Demo chatbot created');
  } else {
    console.log('ℹ️  Test user already exists');
  }
}

// Main migration function
async function runMigration() {
  try {
    console.log('🚀 Starting database migration...\n');
    
    await createIndexes();
    await createInitialPricingPlans();
    await seedDevelopmentData();
    
    console.log('\n✅ Database migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  runMigration();
}

export { runMigration, createInitialPricingPlans, createIndexes, seedDevelopmentData };