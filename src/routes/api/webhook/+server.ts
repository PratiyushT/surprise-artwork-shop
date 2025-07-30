import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Stripe } from 'stripe';
import {
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET,
  PEXELS_KEY,
  ZAPIER_WEBHOOK_URL,
  ZAPIER_SECRET_KEY
} from '$env/static/private';
import type { PurchaseData } from '../../../app.d.ts';
import { StripeService } from '../../../lib/services/stripe.ts';
import { PexelsService } from '../../../lib/services/pexels.ts';
import { ZapierService } from '../../../lib/services/zapier.ts';
import { PEXELS_QUERIES } from '../../../lib/config.ts';

export const POST: RequestHandler = async ({ request }) => {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return json({ error: 'No signature provided' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const stripeService = new StripeService(STRIPE_SECRET_KEY);
    event = await stripeService.constructWebhookEvent(payload, signature, STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    try {
      // Extract purchase information from session metadata
      const metadata = session.metadata;
      if (!metadata) {
        throw new Error('No metadata found in session');
      }

      const tierData = {
        id: metadata.tier_id,
        name: metadata.tier_name,
        price: parseInt(metadata.tier_price),
        description: '', // We don't store description in metadata
        features: [] // We don't store features in metadata
      };

      const tipAmount = parseInt(metadata.tip_amount) || 0;
      const totalAmount = parseInt(metadata.total_amount);

      // Initialize services
      const pexelsService = new PexelsService(PEXELS_KEY);
      const zapierService = new ZapierService(ZAPIER_WEBHOOK_URL, ZAPIER_SECRET_KEY);

      // Get the appropriate search query based on tier
      const searchQuery = PEXELS_QUERIES[tierData.id as keyof typeof PEXELS_QUERIES] || PEXELS_QUERIES.basic;

      // Fetch random image from Pexels
      const image = await pexelsService.getRandomPhoto(searchQuery);

      if (!image) {
        console.error('Failed to fetch image from Pexels');
        return json({ error: 'Failed to fetch artwork' }, { status: 500 });
      }

      // Prepare purchase data for Zapier
      const purchaseData: PurchaseData = {
        customer_email: session.customer_details?.email || '',
        tier: tierData,
        tip_amount: tipAmount,
        total_amount: totalAmount,
        stripe_session_id: session.id,
        image: image,
        purchase_date: new Date().toISOString()
      };

      // Send data to Zapier webhook
      const zapierResult = await zapierService.sendPurchaseData(purchaseData);

      if (!zapierResult.success) {
        console.error('Failed to send data to Zapier:', zapierResult.error);
        // Don't fail the webhook, just log the error
      }

      console.log('Successfully processed purchase:', {
        sessionId: session.id,
        customerEmail: purchaseData.customer_email,
        tier: tierData.name,
        totalAmount: totalAmount,
        imageId: image.id,
        zapierSent: zapierResult.success
      });

      return json({ success: true });

    } catch (error) {
      console.error('Error processing webhook:', error);
      return json({ error: 'Processing failed' }, { status: 500 });
    }
  }

  // Return success for unhandled event types
  return json({ success: true });
};
