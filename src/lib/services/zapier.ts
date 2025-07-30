import type { PurchaseData } from '../../app.d.ts';
import { logger, logError } from '../logger.ts';

export class ZapierService {
  private webhookUrl: string;
  private secretKey: string;

  constructor(webhookUrl: string, secretKey: string) {
    this.webhookUrl = webhookUrl;
    this.secretKey = secretKey;

    logger.debug('⚡ Initializing Zapier service', {
      webhookUrl: webhookUrl.substring(0, 50) + '...',
      hasSecretKey: !!secretKey,
      secretKeyPrefix: secretKey.substring(0, 8) + '...'
    });

    logger.zapier('Service initialized successfully');
  }

  async sendPurchaseData(purchaseData: PurchaseData): Promise<{ success: boolean; error?: string }> {
    const endTimer = logger.startTimer('Zapier webhook send');

    const payload = {
      ...purchaseData,
      timestamp: new Date().toISOString(),
      source: 'surprise-artwork-shop'
    };

    logger.zapier('Sending purchase data to webhook', {
      customerEmail: purchaseData.customer_email,
      tierName: purchaseData.tier.name,
      totalAmount: purchaseData.total_amount,
      stripeSessionId: purchaseData.stripe_session_id,
      imageId: purchaseData.image.id,
      photographer: purchaseData.image.photographer,
      payloadSize: JSON.stringify(payload).length
    });

    try {
      logger.request('POST', this.webhookUrl, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ***',
          'User-Agent': 'SurpriseArtworkShop/1.0'
        },
        bodySize: JSON.stringify(payload).length
      });

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.secretKey}`,
          'User-Agent': 'SurpriseArtworkShop/1.0'
        },
        body: JSON.stringify(payload)
      });

      logger.response(response.status, this.webhookUrl, {
        ok: response.ok,
        statusText: response.statusText,
        headers: {
          contentType: response.headers.get('content-type'),
          contentLength: response.headers.get('content-length')
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Zapier webhook returned error status', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText.substring(0, 500),
          customerEmail: purchaseData.customer_email
        });
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json().catch(() => null);

      logger.zapier('Purchase data sent successfully', {
        customerEmail: purchaseData.customer_email,
        responseData: result,
        responseStatus: response.status
      });

      endTimer();
      return { success: true };
    } catch (error) {
      endTimer();
      logError(error as Error, {
        customerEmail: purchaseData.customer_email,
        tierName: purchaseData.tier.name,
        action: 'sendPurchaseData',
        webhookUrl: this.webhookUrl.substring(0, 50) + '...'
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    const endTimer = logger.startTimer('Zapier connection test');

    const testData = {
      test: true,
      timestamp: new Date().toISOString(),
      source: 'surprise-artwork-shop-test'
    };

    logger.zapier('Testing webhook connection', {
      webhookUrl: this.webhookUrl.substring(0, 50) + '...',
      testDataSize: JSON.stringify(testData).length
    });

    try {
      logger.request('POST', this.webhookUrl, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ***',
          'User-Agent': 'SurpriseArtworkShop/1.0'
        },
        bodySize: JSON.stringify(testData).length,
        isTest: true
      });

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.secretKey}`,
          'User-Agent': 'SurpriseArtworkShop/1.0'
        },
        body: JSON.stringify(testData)
      });

      logger.response(response.status, this.webhookUrl, {
        ok: response.ok,
        statusText: response.statusText,
        isTest: true
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      logger.zapier('Connection test successful', {
        responseStatus: response.status,
        responseOk: response.ok
      });

      endTimer();
      return { success: true };
    } catch (error) {
      endTimer();
      logError(error as Error, {
        action: 'testConnection',
        webhookUrl: this.webhookUrl.substring(0, 50) + '...'
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
