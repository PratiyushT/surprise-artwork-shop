import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
  PEXELS_KEY,
  ZAPIER_WEBHOOK_URL,
  ZAPIER_SECRET_KEY
} from '$env/static/private';
import { PexelsService } from '../../../../lib/services/pexels.ts';
import { ZapierService } from '../../../../lib/services/zapier.ts';

export const POST: RequestHandler = async () => {
  try {
    const results = {
      pexels: null as any,
      zapier: null as any,
      overall: false
    };

    // Test Pexels API
    try {
      const pexelsService = new PexelsService(PEXELS_KEY);
      const image = await pexelsService.getRandomPhoto('nature art landscape');

      results.pexels = {
        success: !!image,
        message: image ? `Successfully fetched image by ${image.photographer}` : 'Failed to fetch image',
        imageId: image?.id,
        photographer: image?.photographer
      };
    } catch (error) {
      results.pexels = {
        success: false,
        message: `Pexels API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Test Zapier webhook
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

      const zapierResult = await zapierService.sendPurchaseData(testData);

      results.zapier = {
        success: zapierResult.success,
        message: zapierResult.success ? 'Zapier webhook successful' : `Zapier webhook failed: ${zapierResult.error}`,
        error: zapierResult.error
      };
    } catch (error) {
      results.zapier = {
        success: false,
        message: `Zapier service error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    results.overall = results.pexels.success && results.zapier.success;

    return json({
      success: results.overall,
      message: results.overall
        ? 'All webhook integrations working correctly!'
        : 'Some integrations have issues - check details below',
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Debug webhook test error:', error);
    return json({
      success: false,
      message: 'Debug test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
};
