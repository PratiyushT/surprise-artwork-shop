import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
  PEXELS_KEY,
  ZAPIER_WEBHOOK_URL,
  ZAPIER_SECRET_KEY
} from '$env/static/private';
import { PexelsService } from '../../../../lib/services/pexels.ts';
import { ZapierService } from '../../../../lib/services/zapier.ts';
import { logger, logError } from '../../../../lib/logger.ts';

export const POST: RequestHandler = async () => {
  const debugTimer = logger.startTimer('Debug webhook integration test');

  logger.info('🔧 Starting debug integration test', {
    timestamp: new Date().toISOString(),
    services: ['Pexels', 'Zapier'],
    action: 'comprehensive integration test'
  });

  try {
    const results = {
      pexels: null as any,
      zapier: null as any,
      overall: false
    };

    logger.debug('🧪 Beginning service tests', {
      testsPlanned: 2,
      services: ['Pexels API', 'Zapier Webhook']
    });

    // Test Pexels API
    logger.debug('🖼️  Testing Pexels API integration');
    try {
      const pexelsService = new PexelsService(PEXELS_KEY);
      const image = await pexelsService.getRandomPhoto('nature art landscape');

      results.pexels = {
        success: !!image,
        message: image ? `Successfully fetched image by ${image.photographer}` : 'Failed to fetch image',
        imageId: image?.id,
        photographer: image?.photographer,
        imageUrl: image?.url,
        dimensions: image ? `${image.width}x${image.height}` : null
      };

      if (image) {
        logger.info('✅ Pexels API test successful', {
          imageId: image.id,
          photographer: image.photographer,
          dimensions: `${image.width}x${image.height}`,
          url: image.url
        });
      } else {
        logger.warn('⚠️  Pexels API test failed - no image returned');
      }
    } catch (error) {
      logError(error as Error, {
        service: 'Pexels',
        action: 'debug test',
        query: 'nature art landscape'
      });
      results.pexels = {
        success: false,
        message: `Pexels API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Test Zapier webhook
    logger.debug('⚡ Testing Zapier webhook integration');
    try {
      const zapierService = new ZapierService(ZAPIER_WEBHOOK_URL, ZAPIER_SECRET_KEY);

      const testData = {
        test: true,
        customer_email: "debug@example.com",
        tier: {
          id: "debug",
          name: "Debug Test",
          price: 0.01
        },
        tip_amount: 0,
        total_amount: 0.01,
        stripe_session_id: "cs_debug_test_session",
        image: {
          id: 12345,
          url: "https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg",
          photographer: "Debug Photographer",
          photographer_url: "https://www.pexels.com/@debug",
          width: 1920,
          height: 1080,
          src: {
            original: "https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg",
            large: "https://images.pexels.com/photos/417074/pexels-photo-417074-large.jpeg"
          }
        },
        purchase_date: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        source: "surprise-artwork-shop-debug"
      };

      logger.debug('📦 Prepared test data for Zapier', {
        customerEmail: testData.customer_email,
        tierName: testData.tier.name,
        dataSize: JSON.stringify(testData).length
      });

      const zapierResult = await zapierService.sendPurchaseData(testData);

      results.zapier = {
        success: zapierResult.success,
        message: zapierResult.success ? 'Zapier webhook successful' : `Zapier webhook failed: ${zapierResult.error}`,
        error: zapierResult.error,
        webhookUrl: ZAPIER_WEBHOOK_URL.substring(0, 50) + '...'
      };

      if (zapierResult.success) {
        logger.info('✅ Zapier webhook test successful', {
          webhookUrl: ZAPIER_WEBHOOK_URL.substring(0, 50) + '...',
          testData: {
            customerEmail: testData.customer_email,
            tier: testData.tier.name
          }
        });
      } else {
        logger.error('❌ Zapier webhook test failed', {
          error: zapierResult.error,
          webhookUrl: ZAPIER_WEBHOOK_URL.substring(0, 50) + '...'
        });
      }
    } catch (error) {
      logError(error as Error, {
        service: 'Zapier',
        action: 'debug test',
        webhookUrl: ZAPIER_WEBHOOK_URL.substring(0, 50) + '...'
      });
      results.zapier = {
        success: false,
        message: `Zapier service error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    results.overall = results.pexels.success && results.zapier.success;

    logger.info('🏁 Debug integration test completed', {
      overall: results.overall,
      pexelsSuccess: results.pexels.success,
      zapierSuccess: results.zapier.success,
      summary: results.overall
        ? 'All integrations working correctly'
        : 'Some integrations have issues'
    });

    debugTimer();
    return json({
      success: results.overall,
      message: results.overall
        ? 'All webhook integrations working correctly!'
        : 'Some integrations have issues - check details below',
      results,
      timestamp: new Date().toISOString(),
      environment: logger.getEnvironmentInfo()
    });

  } catch (error) {
    debugTimer();
    logError(error as Error, {
      action: 'debug webhook test',
      services: ['Pexels', 'Zapier']
    });
    return json({
      success: false,
      message: 'Debug test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      environment: logger.getEnvironmentInfo()
    }, { status: 500 });
  }
};
