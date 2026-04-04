import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';
import type { SubscriptionPlan } from '@/types';

export const runtime = 'nodejs';

interface CheckoutRequest {
  priceId: string;
  planSlug: SubscriptionPlan;
  interval: 'monthly' | 'yearly';
}

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

    const body: CheckoutRequest = await request.json();
    const { priceId, planSlug, interval } = body;

    if (!priceId || !planSlug || !interval) {
      return NextResponse.json(
        { error: 'Missing required fields: priceId, planSlug, interval' },
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

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${origin}/dashboard/billing?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${origin}/dashboard/billing?cancel=true`,
      metadata: {
        userId: user.id,
        planSlug,
        interval,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Checkout failed' },
      { status: 500 }
    );
  }
}
