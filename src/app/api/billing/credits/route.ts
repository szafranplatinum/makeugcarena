import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

export const runtime = 'nodejs';

// Credit packages configuration
const CREDIT_PACKAGES = [
  { id: 'credits_10', credits: 10, price: 9.99, popular: false },
  { id: 'credits_50', credits: 50, price: 39.99, popular: true },
  { id: 'credits_100', credits: 100, price: 69.99, popular: false },
  { id: 'credits_500', credits: 500, price: 299.99, popular: false },
];

interface CreditPurchaseRequest {
  packageId?: string;
  credits?: number;
  price?: number;
}

// GET - List available credit packages
export async function GET() {
  try {
    return NextResponse.json(CREDIT_PACKAGES);
  } catch (error) {
    console.error('Error fetching credit packages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credit packages' },
      { status: 500 }
    );
  }
}

// POST - Create Stripe checkout session for credit purchase
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: CreditPurchaseRequest = await request.json();
    const { packageId, credits, price } = body;

    // Validate input
    let creditAmount: number;
    let creditPrice: number;

    if (packageId) {
      const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
      if (!pkg) {
        return NextResponse.json(
          { error: 'Invalid package ID' },
          { status: 400 }
        );
      }
      creditAmount = pkg.credits;
      creditPrice = pkg.price;
    } else if (credits && price) {
      creditAmount = credits;
      creditPrice = price;
    } else {
      return NextResponse.json(
        { error: 'Either packageId or both credits and price are required' },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single();

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    let customerId = userProfile.stripe_customer_id;

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: userProfile.email,
        metadata: {
          userId: user.id,
          email: userProfile.email,
        },
      });
      customerId = customer.id;

      // Update user profile with stripe_customer_id
      await supabase
        .from('user_profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // Get the origin for redirect URLs
    const origin = request.headers.get('origin') || 'https://localhost:3000';

    // Create checkout session for one-time payment
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${creditAmount} Credits`,
              description: `One-time credit purchase for ${creditAmount} credits`,
            },
            unit_amount: Math.round(creditPrice * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/dashboard/billing?credits_success=true&credits=${creditAmount}`,
      cancel_url: `${origin}/dashboard/billing?cancel=true`,
      metadata: {
        userId: user.id,
        credits: creditAmount.toString(),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Credit purchase error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Credit purchase failed' },
      { status: 500 }
    );
  }
}
