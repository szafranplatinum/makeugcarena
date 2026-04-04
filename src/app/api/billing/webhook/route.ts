import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { stripe, getPriceIdInfo } from '@/lib/stripe';
import type { Stripe } from 'stripe';

export const runtime = 'nodejs';

// Helper: Get plan credits from price info
async function getPlanCredits(plan: string, interval: string): Promise<number> {
  const supabase = createAdminSupabaseClient();
  const { data } = await supabase
    .from('plan_configs')
    .select('credits_monthly')
    .eq('slug', plan)
    .single();

  return data?.credits_monthly || 0;
}

// Helper: Map Stripe price ID to plan slug and get credits
async function getPlanInfoFromPrice(priceId: string) {
  const priceInfo = getPriceIdInfo(priceId);
  if (!priceInfo) return null;

  const credits = await getPlanCredits(priceInfo.plan, priceInfo.interval);
  return { plan: priceInfo.plan, interval: priceInfo.interval, credits };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminSupabaseClient();
    const body = await request.text();

    // Verify webhook signature
    const signature = request.headers.get('stripe-signature');
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;

        if (!userId) {
          console.warn('Missing userId in checkout.session.completed');
          return NextResponse.json({ received: true });
        }

        // Handle one-time credit purchases
        if (session.mode === 'payment') {
          const creditsStr = session.metadata?.credits;
          const credits = creditsStr ? parseInt(creditsStr, 10) : 0;

          if (!credits) {
            console.warn('Missing or invalid credits amount in payment session');
            return NextResponse.json({ received: true });
          }

          // Get current user profile to add credits
          const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('credits_remaining')
            .eq('id', userId)
            .single();

          const currentCredits = userProfile?.credits_remaining || 0;
          const newCreditsTotal = currentCredits + credits;

          // Update user profile with additional credits
          await supabase
            .from('user_profiles')
            .update({
              credits_remaining: newCreditsTotal,
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

          // Create credit transaction record
          await supabase
            .from('credit_transactions')
            .insert({
              user_id: userId,
              amount: credits,
              action: 'purchase',
              description: `One-time credit purchase for ${credits} credits`,
              video_project_id: null,
            });

          break;
        }

        // Handle subscription checkout (existing logic)
        const planSlug = session.metadata?.planSlug;
        const interval = session.metadata?.interval;

        if (!planSlug) {
          console.warn('Missing metadata in checkout.session.completed');
          return NextResponse.json({ received: true });
        }

        // Get the subscription ID from the session
        const subscriptionId = session.subscription as string;

        // Get plan info and credits
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceInfo = getPriceIdInfo(
          (subscription.items.data[0]?.price.id) as string
        );

        if (!priceInfo) {
          console.warn('Could not determine plan from price ID');
          return NextResponse.json({ received: true });
        }

        const credits = await getPlanCredits(
          planSlug,
          priceInfo.interval
        );

        // Update user profile with subscription info
        await supabase
          .from('user_profiles')
          .update({
            plan: planSlug,
            subscription_status: 'active',
            stripe_subscription_id: subscriptionId,
            credits_remaining: credits,
            credits_monthly: credits,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        // Create credit transaction record
        await supabase
          .from('credit_transactions')
          .insert({
            user_id: userId,
            amount: credits,
            action: 'purchase',
            description: `Subscription to ${planSlug} plan (${priceInfo.interval})`,
            video_project_id: null,
          });

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by stripe_customer_id
        const { data: userProfiles } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('stripe_customer_id', customerId);

        if (!userProfiles || userProfiles.length === 0) {
          console.warn('User not found for customer:', customerId);
          return NextResponse.json({ received: true });
        }

        const userId = userProfiles[0].id;

        // Get new plan from the subscription
        const priceId = (subscription.items.data[0]?.price.id) as string;
        const priceInfo = getPriceIdInfo(priceId);

        if (priceInfo) {
          const credits = await getPlanCredits(priceInfo.plan, priceInfo.interval);

          await supabase
            .from('user_profiles')
            .update({
              plan: priceInfo.plan,
              subscription_status: subscription.status === 'active' ? 'active' : 'past_due',
              credits_monthly: credits,
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by stripe_customer_id
        const { data: userProfiles } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('stripe_customer_id', customerId);

        if (!userProfiles || userProfiles.length === 0) {
          return NextResponse.json({ received: true });
        }

        const userId = userProfiles[0].id;

        // Reset to free plan
        await supabase
          .from('user_profiles')
          .update({
            plan: 'free',
            subscription_status: 'canceled',
            stripe_subscription_id: null,
            credits_remaining: 0,
            credits_monthly: 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Find user by stripe_customer_id
        const { data: userProfiles } = await supabase
          .from('user_profiles')
          .select('id, credits_monthly, plan')
          .eq('stripe_customer_id', customerId);

        if (!userProfiles || userProfiles.length === 0) {
          return NextResponse.json({ received: true });
        }

        const userId = userProfiles[0].id;
        const monthlyCredits = userProfiles[0].credits_monthly || 0;

        // Reset monthly credits on renewal
        await supabase
          .from('user_profiles')
          .update({
            credits_remaining: monthlyCredits,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        // Create transaction record for subscription renewal
        await supabase
          .from('credit_transactions')
          .insert({
            user_id: userId,
            amount: monthlyCredits,
            action: 'subscription_renewal',
            description: 'Monthly subscription renewal',
            video_project_id: null,
          });

        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Find user by stripe_customer_id
        const { data: userProfiles } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('stripe_customer_id', customerId);

        if (!userProfiles || userProfiles.length === 0) {
          return NextResponse.json({ received: true });
        }

        const userId = userProfiles[0].id;

        // Set status to past_due
        await supabase
          .from('user_profiles')
          .update({
            subscription_status: 'past_due',
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
