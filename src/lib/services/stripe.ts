import Stripe from 'stripe';
import type { PricingTier } from '../../app.d.ts';
import { logger, logError } from '../logger.ts';

export class StripeService {
  private stripe: Stripe;

  constructor(secretKey: string) {
    logger.debug('🔧 Initializing Stripe service', {
      apiVersion: '2024-12-18.acacia',
      keyPrefix: secretKey.substring(0, 8) + '...'
    });

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2024-12-18.acacia'
    });

    logger.stripe('Service initialized successfully');
  }

  // Convert dollar amount to cents for Stripe API
  private dollarsToCents(dollars: number): number {
    return Math.round(dollars * 100);
  }

  async createCheckoutSession(
    tier: PricingTier,
    tipAmount: number,
    baseUrl: string
  ): Promise<Stripe.Checkout.Session> {
    const endTimer = logger.startTimer('Stripe checkout session creation');

    logger.stripe('Creating checkout session', {
      tier: tier.name,
      tierPrice: tier.price,
      tipAmount,
      totalAmount: tier.price + tipAmount,
      baseUrl
    });

    try {
      // Convert dollar amounts to cents for Stripe
      const tierPriceCents = this.dollarsToCents(tier.price);
      const tipAmountCents = this.dollarsToCents(tipAmount);

      logger.debug('💰 Price conversion', {
        tierPriceDollars: tier.price,
        tierPriceCents,
        tipAmountDollars: tipAmount,
        tipAmountCents
      });

      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: tier.name,
              description: tier.description,
              images: ['https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400']
            },
            unit_amount: tierPriceCents,
          },
          quantity: 1,
        }
      ];

      // Add tip as separate line item if provided
      if (tipAmount > 0) {
        logger.debug('💝 Adding tip to line items', { tipAmount, tipAmountCents });
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Tip for Artist',
              description: 'Support the amazing photographers'
            },
            unit_amount: tipAmountCents,
          },
          quantity: 1,
        });
      }

      const totalAmount = tier.price + (tipAmount || 0);

      logger.debug('🛒 Prepared line items', {
        itemCount: lineItems.length,
        totalAmount,
        lineItems: lineItems.map(item => ({
          name: item.price_data?.product_data?.name,
          amount: item.price_data?.unit_amount
        }))
      });

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}`,
        metadata: {
          tier_id: tier.id,
          tier_name: tier.name,
          tier_price: tier.price.toString(),
          tip_amount: tipAmount.toString(),
          total_amount: totalAmount.toString()
        },
        billing_address_collection: 'required',
        customer_email: undefined,
        automatic_tax: {
          enabled: false,
        }
      };

      logger.debug('🔧 Session parameters prepared', {
        successUrl: sessionParams.success_url,
        cancelUrl: sessionParams.cancel_url,
        metadata: sessionParams.metadata
      });

      const session = await this.stripe.checkout.sessions.create(sessionParams);

      logger.stripe('Checkout session created successfully', {
        sessionId: session.id,
        url: session.url,
        status: session.status,
        customerEmail: session.customer_email,
        totalAmount: session.amount_total
      });

      endTimer();
      return session;

    } catch (error) {
      endTimer();
      logError(error as Error, {
        tier: tier.name,
        tipAmount,
        baseUrl,
        action: 'createCheckoutSession'
      });
      throw error;
    }
  }

  async constructWebhookEvent(payload: string, signature: string, webhookSecret: string): Promise<Stripe.Event> {
    logger.debug('🔐 Constructing webhook event', {
      payloadLength: payload.length,
      hasSignature: !!signature,
      hasSecret: !!webhookSecret,
      secretPrefix: webhookSecret.substring(0, 8) + '...'
    });

    try {
      const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);

      logger.stripe('Webhook event constructed successfully', {
        eventId: event.id,
        eventType: event.type,
        created: event.created,
        livemode: event.livemode
      });

      return event;
    } catch (error) {
      logError(error as Error, {
        action: 'constructWebhookEvent',
        payloadLength: payload.length,
        hasSignature: !!signature
      });
      throw error;
    }
  }

  async retrieveSession(sessionId: string): Promise<Stripe.Checkout.Session> {
    logger.debug('📄 Retrieving checkout session', { sessionId });

    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);

      logger.stripe('Session retrieved successfully', {
        sessionId: session.id,
        status: session.status,
        paymentStatus: session.payment_status,
        customerEmail: session.customer_details?.email
      });

      return session;
    } catch (error) {
      logError(error as Error, {
        action: 'retrieveSession',
        sessionId
      });
      throw error;
    }
  }

  async retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    logger.debug('💳 Retrieving payment intent', { paymentIntentId });

    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      logger.stripe('Payment intent retrieved successfully', {
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency
      });

      return paymentIntent;
    } catch (error) {
      logError(error as Error, {
        action: 'retrievePaymentIntent',
        paymentIntentId
      });
      throw error;
    }
  }
}
