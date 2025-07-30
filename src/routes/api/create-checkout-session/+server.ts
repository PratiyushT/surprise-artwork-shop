import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { STRIPE_SECRET_KEY } from '$env/static/private';
import { PUBLIC_SITE_URL } from '$env/static/public';
import type { PricingTier } from '../../../app.d.ts';
import { StripeService } from '../../../lib/services/stripe.ts';
import { logger, logPaymentFlow, logError } from '../../../lib/logger.ts';

export const POST: RequestHandler = async ({ request }) => {
  const sessionTimer = logger.startTimer('Checkout session creation');

  logger.info('🛒 Checkout session request received', {
    method: request.method,
    contentType: request.headers.get('content-type'),
    userAgent: request.headers.get('user-agent'),
    url: request.url
  });

  try {
    const requestData = await request.json();
    const { tier, tipAmount }: { tier: PricingTier; tipAmount: number } = requestData;

    logger.debug('📋 Checkout request data', {
      tier: tier?.name,
      tierPrice: tier?.price,
      tipAmount: tipAmount || 0,
      totalAmount: tier ? tier.price + (tipAmount || 0) : 0,
      hasValidTier: !!tier
    });

    if (!tier) {
      logger.error('❌ Invalid tier provided in checkout request', {
        receivedData: requestData
      });
      return json({ error: 'Invalid tier selected' }, { status: 400 });
    }

    if (!tier.id || !tier.name || typeof tier.price !== 'number') {
      logger.error('❌ Malformed tier data', {
        tier,
        missingFields: {
          id: !tier.id,
          name: !tier.name,
          price: typeof tier.price !== 'number'
        }
      });
      return json({ error: 'Invalid tier data' }, { status: 400 });
    }

    logPaymentFlow('Creating Stripe checkout session', 'pending', {
      tier: tier.name,
      tierPrice: tier.price,
      tipAmount: tipAmount || 0,
      totalAmount: tier.price + (tipAmount || 0)
    });

    const stripeService = new StripeService(STRIPE_SECRET_KEY);
    const session = await stripeService.createCheckoutSession(tier, tipAmount || 0, PUBLIC_SITE_URL);

    logPaymentFlow('Checkout session created successfully', session.id, {
      sessionUrl: session.url,
      tier: tier.name,
      totalAmount: tier.price + (tipAmount || 0),
      sessionStatus: session.status
    });

    logger.info('✅ Checkout session created successfully', {
      sessionId: session.id,
      tier: tier.name,
      totalAmount: tier.price + (tipAmount || 0),
      redirectUrl: session.url
    });

    sessionTimer();
    return json({ url: session.url });
  } catch (error) {
    sessionTimer();
    logError(error as Error, {
      action: 'create checkout session',
      url: request.url,
      method: request.method
    });
    return json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
};
