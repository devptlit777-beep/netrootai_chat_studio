import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@12.18.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, stripe-signature',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const body = await req.text();
  const sig = req.headers.get('stripe-signature') ?? '';

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const planId = session.metadata?.planId ?? 'pro';
    const customerEmail = session.customer_details?.email;

    console.log(
      `checkout.session.completed — plan: ${planId}, email: ${customerEmail}`
    );

    if (customerEmail) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const { data: users } = await supabase.auth.admin.listUsers();
      const user = users?.users?.find((u) => u.email === customerEmail);

      if (user) {
        await supabase.auth.admin.updateUserById(user.id, {
          user_metadata: {
            plan: planId,
            stripe_customer: session.customer,
          },
        });

        console.log(`Updated plan to ${planId} for user ${user.id}`);
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
});