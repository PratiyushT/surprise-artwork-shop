<script lang="ts">
  let zapierUrl = '';
  let zapierSecret = '';
  let pexelsKey = '';
  let testResults = {
    zapier: null as any,
    pexels: null as any
  };
  let isLoading = false;

  async function testZapierWebhook() {
    if (!zapierUrl || !zapierSecret) {
      alert('Please enter Zapier webhook URL and secret key');
      return;
    }

    try {
      const testData = {
        test: true,
        customer_email: "test@example.com",
        tier: {
          id: "premium",
          name: "Premium Surprise",
          price: 19.99
        },
        tip_amount: 2.00,
        total_amount: 21.99,
        stripe_session_id: "cs_test_debug_session",
        image: {
          id: 12345,
          url: "https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg",
          photographer: "Test Photographer",
          photographer_url: "https://www.pexels.com/@test"
        },
        purchase_date: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        source: "surprise-artwork-shop-debug"
      };

      const response = await fetch(zapierUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${zapierSecret}`,
          'User-Agent': 'SurpriseArtworkShop-Debug/1.0'
        },
        body: JSON.stringify(testData)
      });

      testResults.zapier = {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        response: response.ok ? await response.text() : await response.text()
      };
    } catch (error) {
      testResults.zapier = {
        success: false,
        error: error.message
      };
    }
  }

  async function testPexelsAPI() {
    if (!pexelsKey) {
      alert('Please enter Pexels API key');
      return;
    }

    try {
      const response = await fetch('https://api.pexels.com/v1/search?query=nature&per_page=1', {
        headers: {
          'Authorization': pexelsKey
        }
      });

      const data = await response.json();

      testResults.pexels = {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        data: response.ok ? data : null,
        error: !response.ok ? data : null
      };
    } catch (error) {
      testResults.pexels = {
        success: false,
        error: error.message
      };
    }
  }

  async function testStripeWebhook() {
    try {
      const response = await fetch('/api/debug/test-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      alert(`Stripe webhook test: ${result.success ? 'SUCCESS' : 'FAILED'}\n${result.message}`);
    } catch (error) {
      alert(`Error testing Stripe webhook: ${error.message}`);
    }
  }

  async function runAllTests() {
    isLoading = true;
    testResults = { zapier: null, pexels: null };

    await Promise.all([
      testZapierWebhook(),
      testPexelsAPI()
    ]);

    isLoading = false;
  }
</script>

<svelte:head>
  <title>Debug - Webhook Integration Testing</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-12">
  <div class="max-w-4xl mx-auto px-4">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-4">🔧 Webhook Integration Debug</h1>
      <p class="text-gray-600">Test your Stripe, Zapier, and Pexels integrations</p>
    </div>

    <!-- Warning Banner -->
    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-yellow-800">Testing Environment Only</h3>
          <p class="text-sm text-yellow-700 mt-1">This debug page is for testing webhook integrations. Never expose real API keys in production.</p>
        </div>
      </div>
    </div>

    <div class="grid md:grid-cols-2 gap-8">
      <!-- Configuration Panel -->
      <div class="space-y-6">
        <div class="card p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4">🔑 API Configuration</h2>

          <div class="space-y-4">
            <div>
              <label for="zapier-url" class="block text-sm font-medium text-gray-700 mb-2">
                Zapier Webhook URL
              </label>
              <input
                id="zapier-url"
                type="url"
                placeholder="https://hooks.zapier.com/hooks/catch/..."
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                bind:value={zapierUrl}
              />
            </div>

            <div>
              <label for="zapier-secret" class="block text-sm font-medium text-gray-700 mb-2">
                Zapier Secret Key
              </label>
              <input
                id="zapier-secret"
                type="password"
                placeholder="Your secret key for authentication"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                bind:value={zapierSecret}
              />
            </div>

            <div>
              <label for="pexels-key" class="block text-sm font-medium text-gray-700 mb-2">
                Pexels API Key
              </label>
              <input
                id="pexels-key"
                type="password"
                placeholder="Your Pexels API key"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                bind:value={pexelsKey}
              />
            </div>
          </div>
        </div>

        <!-- Individual Tests -->
        <div class="card p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4">🧪 Individual Tests</h2>

          <div class="space-y-3">
            <button
              on:click={testZapierWebhook}
              disabled={!zapierUrl || !zapierSecret}
              class="w-full btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Test Zapier Webhook
            </button>

            <button
              on:click={testPexelsAPI}
              disabled={!pexelsKey}
              class="w-full btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Test Pexels API
            </button>

            <button
              on:click={testStripeWebhook}
              class="w-full btn-secondary"
            >
              Test Stripe Webhook
            </button>

            <button
              on:click={runAllTests}
              disabled={isLoading || !zapierUrl || !zapierSecret || !pexelsKey}
              class="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Testing...' : 'Run All Tests'}
            </button>
          </div>
        </div>
      </div>

      <!-- Results Panel -->
      <div class="space-y-6">
        <div class="card p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4">📊 Test Results</h2>

          <!-- Zapier Results -->
          {#if testResults.zapier}
            <div class="mb-6">
              <h3 class="font-semibold text-gray-900 mb-2 flex items-center">
                <span class="mr-2">🔗 Zapier Webhook</span>
                <span class="px-2 py-1 text-xs rounded-full {testResults.zapier.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                  {testResults.zapier.success ? 'SUCCESS' : 'FAILED'}
                </span>
              </h3>
              <div class="bg-gray-50 rounded p-3 text-sm">
                {#if testResults.zapier.success}
                  <p><strong>Status:</strong> {testResults.zapier.status} {testResults.zapier.statusText}</p>
                  <p><strong>Response:</strong> {testResults.zapier.response}</p>
                {:else}
                  <p class="text-red-600"><strong>Error:</strong> {testResults.zapier.error}</p>
                {/if}
              </div>
            </div>
          {/if}

          <!-- Pexels Results -->
          {#if testResults.pexels}
            <div class="mb-6">
              <h3 class="font-semibold text-gray-900 mb-2 flex items-center">
                <span class="mr-2">🖼️ Pexels API</span>
                <span class="px-2 py-1 text-xs rounded-full {testResults.pexels.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                  {testResults.pexels.success ? 'SUCCESS' : 'FAILED'}
                </span>
              </h3>
              <div class="bg-gray-50 rounded p-3 text-sm">
                {#if testResults.pexels.success}
                  <p><strong>Status:</strong> {testResults.pexels.status} {testResults.pexels.statusText}</p>
                  {#if testResults.pexels.data?.photos?.[0]}
                    <p><strong>Sample Image:</strong> {testResults.pexels.data.photos[0].photographer}</p>
                    <img
                      src={testResults.pexels.data.photos[0].src.small}
                      alt="Test"
                      class="mt-2 rounded max-w-32 h-auto"
                    />
                  {/if}
                {:else}
                  <p class="text-red-600"><strong>Error:</strong> {testResults.pexels.error || testResults.pexels.statusText}</p>
                {/if}
              </div>
            </div>
          {/if}

          {#if !testResults.zapier && !testResults.pexels && !isLoading}
            <p class="text-gray-500 text-center py-8">No tests run yet. Configure your API keys and run tests above.</p>
          {/if}

          {#if isLoading}
            <div class="text-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p class="text-gray-500 mt-2">Running tests...</p>
            </div>
          {/if}
        </div>

        <!-- Integration Guide -->
        <div class="card p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4">📚 Quick Setup Guide</h2>

          <div class="space-y-3 text-sm text-gray-600">
            <div>
              <h4 class="font-medium text-gray-900">1. Stripe Webhook</h4>
              <p>Set up at dashboard.stripe.com/webhooks</p>
              <p>Event: <code class="bg-gray-100 px-1 rounded">checkout.session.completed</code></p>
            </div>

            <div>
              <h4 class="font-medium text-gray-900">2. Zapier Webhook</h4>
              <p>Create "Catch Hook" trigger at zapier.com</p>
              <p>Add Authorization header with Bearer token</p>
            </div>

            <div>
              <h4 class="font-medium text-gray-900">3. Pexels API</h4>
              <p>Get free API key at pexels.com/api</p>
              <p>No additional setup required</p>
            </div>
          </div>

          <div class="mt-4 p-3 bg-blue-50 rounded">
            <p class="text-sm text-blue-700">
              💡 <strong>Tip:</strong> Check the <a href="/docs/INTEGRATION_GUIDE.md" class="underline">full integration guide</a> for detailed setup instructions.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
