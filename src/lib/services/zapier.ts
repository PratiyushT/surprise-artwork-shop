import type { PurchaseData } from '../../app.d.ts';

export class ZapierService {
  private webhookUrl: string;
  private secretKey: string;

  constructor(webhookUrl: string, secretKey: string) {
    this.webhookUrl = webhookUrl;
    this.secretKey = secretKey;
  }

  async sendPurchaseData(purchaseData: PurchaseData): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.secretKey}`,
          'User-Agent': 'SurpriseArtworkShop/1.0'
        },
        body: JSON.stringify({
          ...purchaseData,
          timestamp: new Date().toISOString(),
          source: 'surprise-artwork-shop'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      return { success: true };
    } catch (error) {
      console.error('Error sending to Zapier:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const testData = {
        test: true,
        timestamp: new Date().toISOString(),
        source: 'surprise-artwork-shop-test'
      };

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.secretKey}`,
          'User-Agent': 'SurpriseArtworkShop/1.0'
        },
        body: JSON.stringify(testData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Zapier connection test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
