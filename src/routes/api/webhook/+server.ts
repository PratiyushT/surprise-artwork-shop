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
import { logger, logWebhookEvent, logPaymentFlow, logError } from '../../../lib/logger.ts';

export const POST: RequestHandler = async ({ request }) => {
  const webhookTimer = logger.startTimer('Complete webhook processing');

  logger.webhook('Received webhook request', {
    method: request.method,
    contentType: request.headers.get('content-type'),
    userAgent: request.headers.get('user-agent'),
    hasSignature: !!request.headers.get('stripe-signature')
  });

  try {
    const payload = await request.text();
    const signature = request.headers.get('stripe-signature');

    logger.debug('📥 Webhook payload received', {
      payloadLength: payload.length,
      signaturePresent: !!signature,
      signaturePrefix: signature?.substring(0, 20) + '...'
    });

    if (!signature) {
      logger.error('❌ No Stripe signature provided');
      return json({ error: 'No signature provided' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      const stripeService = new StripeService(STRIPE_SECRET_KEY);
      event = await stripeService.constructWebhookEvent(payload, signature, STRIPE_WEBHOOK_SECRET);
    } catch (error) {
      logError(error as Error, {
        action: 'webhook signature verification',
        payloadLength: payload.length,
        hasSignature: !!signature
      });
      return json({ error: 'Invalid signature' }, { status: 400 });
    }

    logWebhookEvent(event.type, event.id, {
      livemode: event.livemode,
      created: event.created,
      objectType: event.data.object.object
    });

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      logPaymentFlow('Processing completed checkout session', session.id, {
        paymentStatus: session.payment_status,
        customerEmail: session.customer_details?.email,
        amountTotal: session.amount_total,
        currency: session.currency
      });

      try {
        // Extract purchase information from session metadata
        const metadata = session.metadata;
        if (!metadata) {
          throw new Error('No metadata found in session');
        }

        logger.debug('📋 Extracting session metadata', {
          sessionId: session.id,
          metadataKeys: Object.keys(metadata),
          metadata
        });

        const tierData = {
          id: metadata.tier_id,
          name: metadata.tier_name,
          price: parseFloat(metadata.tier_price),
          description: '',
          features: []
        };

        const tipAmount = parseFloat(metadata.tip_amount) || 0;
        const totalAmount = parseFloat(metadata.total_amount);

        logPaymentFlow('Parsed purchase data', session.id, {
          tier: tierData.name,
          tierPrice: tierData.price,
          tipAmount,
          totalAmount,
          customerEmail: session.customer_details?.email
        });

        // Initialize services
        logger.debug('🔧 Initializing external services');
        const pexelsService = new PexelsService(PEXELS_KEY);
        const zapierService = new ZapierService(ZAPIER_WEBHOOK_URL, ZAPIER_SECRET_KEY);

        // Get the appropriate search query based on tier
        const searchQuery = PEXELS_QUERIES[tierData.id as keyof typeof PEXELS_QUERIES] || PEXELS_QUERIES.basic;

        logger.debug('🎯 Selected Pexels search query', {
          tierId: tierData.id,
          tierName: tierData.name,
          searchQuery
        });

        // Fetch random image from Pexels
        logPaymentFlow('Fetching artwork from Pexels', session.id, {
          searchQuery,
          tier: tierData.name
        });

        const image = await pexelsService.getRandomPhoto(searchQuery);

        if (!image) {
          logger.error('❌ Failed to fetch image from Pexels API', {
            sessionId: session.id,
            searchQuery,
            tier: tierData.name
          });
          return json({ error: 'Failed to fetch artwork' }, { status: 500 });
        }

        logPaymentFlow('Artwork fetched successfully', session.id, {
          imageId: image.id,
          photographer: image.photographer,
          imageUrl: image.url,
          dimensions: `${image.width}x${image.height}`
        });

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

        logger.debug('📦 Prepared purchase data package', {
          customerEmail: purchaseData.customer_email,
          dataSize: JSON.stringify(purchaseData).length,
          hasImage: !!purchaseData.image,
          imageId: purchaseData.image.id
        });

        // Send data to Zapier webhook
        logPaymentFlow('Sending data to Zapier automation', session.id, {
          customerEmail: purchaseData.customer_email,
          tier: tierData.name,
          totalAmount
        });

        const zapierResult = await zapierService.sendPurchaseData(purchaseData);

        if (!zapierResult.success) {
          logger.error('⚠️  Zapier webhook failed (non-critical)', {
            sessionId: session.id,
            customerEmail: purchaseData.customer_email,
            error: zapierResult.error,
            tier: tierData.name
          });
          // Don't fail the webhook, just log the error
        }

        // Final success logging
        logger.info('🎉 Purchase processed successfully', {
          sessionId: session.id,
          customerEmail: purchaseData.customer_email,
          tier: tierData.name,
          totalAmount: totalAmount,
          imageId: image.id,
          photographer: image.photographer,
          zapierSent: zapierResult.success,
          processingTime: 'See timer log above'
        });

        webhookTimer();
        return json({ success: true });

      } catch (error) {
        webhookTimer();
        logError(error as Error, {
          sessionId: session.id,
          customerEmail: session.customer_details?.email,
          action: 'processing checkout session'
        });
        return json({ error: 'Processing failed' }, { status: 500 });
      }
    } else {
      // Handle other event types
      logger.info('ℹ️  Received non-checkout event', {
        eventType: event.type,
        eventId: event.id,
        handled: false
      });
    }

    // Return success for unhandled event types
    webhookTimer();
    return json({ success: true });

  } catch (error) {
    webhookTimer();
    logError(error as Error, {
      action: 'webhook processing',
      url: request.url,
      method: request.method
    });
    return json({ error: 'Webhook processing failed' }, { status: 500 });
  }
};
