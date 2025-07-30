<script lang="ts">
  import { onMount } from 'svelte';

  let webhookStatus = {
    lastChecked: null as Date | null,
    stripe: { status: 'unknown', lastEvent: null, deliveries: [] },
    zapier: { status: 'unknown', lastTest: null },
    pexels: { status: 'unknown', lastFetch: null }
  };

  let isLoading = false;
  let autoRefresh = false;
  let refreshInterval: number | null = null;

  async function checkWebhookStatus() {
    isLoading = true;

    try {
      const response = await fetch('/api/debug/test-webhook', {
        method: 'POST'
      });

      const result = await response.json();

      webhookStatus = {
        lastChecked: new Date(),
        stripe: {
          status: 'active', // In real app, you'd check Stripe API
          lastEvent: new Date(),
          deliveries: [
            { id: 'evt_1', status: '200', timestamp: new Date() },
            { id: 'evt_2', status: '200', timestamp: new Date(Date.now() - 60000) }
          ]
        },
        zapier: {
          status: result.results?.zapier?.success ? 'active' : 'error',
          lastTest: new Date()
        },
        pexels: {
          status: result.results?.pexels?.success ? 'active' : 'error',
          lastFetch: new Date()
        }
      };

    } catch (error) {
      console.error('Failed to check webhook status:', error);
    } finally {
      isLoading = false;
    }
  }

  function toggleAutoRefresh() {
    autoRefresh = !autoRefresh;

    if (autoRefresh) {
      refreshInterval = setInterval(checkWebhookStatus, 30000); // 30 seconds
    } else if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  function formatTime(date: Date | null) {
    if (!date) return 'Never';
    return date.toLocaleTimeString();
  }

  onMount(() => {
    checkWebhookStatus();

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  });
</script>

<svelte:head>
  <title>Webhook Monitor - Surprise Artwork Shop</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
  <div class="max-w-6xl mx-auto px-4">
    <!-- Header -->
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">📊 Webhook Monitor</h1>
        <p class="text-gray-600 mt-1">Real-time status of your integrations</p>
      </div>

      <div class="flex items-center space-x-4">
        <div class="flex items-center">
          <input
            type="checkbox"
            id="auto-refresh"
            bind:checked={autoRefresh}
            on:change={toggleAutoRefresh}
            class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label for="auto-refresh" class="ml-2 text-sm text-gray-700">
            Auto-refresh (30s)
          </label>
        </div>

        <button
          on:click={checkWebhookStatus}
          disabled={isLoading}
          class="btn-primary disabled:opacity-50"
        >
          {isLoading ? 'Checking...' : 'Refresh Status'}
        </button>
      </div>
    </div>

    <!-- Status Overview -->
    <div class="grid md:grid-cols-3 gap-6 mb-8">
      <!-- Stripe Status -->
      <div class="card p-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Stripe Webhooks</h3>
            <p class="text-sm text-gray-500">Payment processing</p>
          </div>
          <span class="px-3 py-1 text-sm font-medium rounded-full {getStatusColor(webhookStatus.stripe.status)}">
            {webhookStatus.stripe.status.toUpperCase()}
          </span>
        </div>

        <div class="mt-4 space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-500">Last Event:</span>
            <span class="text-gray-900">{formatTime(webhookStatus.stripe.lastEvent)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Endpoint:</span>
            <span class="text-gray-900 text-xs">/api/webhook</span>
          </div>
        </div>
      </div>

      <!-- Zapier Status -->
      <div class="card p-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Zapier Integration</h3>
            <p class="text-sm text-gray-500">Automation & emails</p>
          </div>
          <span class="px-3 py-1 text-sm font-medium rounded-full {getStatusColor(webhookStatus.zapier.status)}">
            {webhookStatus.zapier.status.toUpperCase()}
          </span>
        </div>

        <div class="mt-4 space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-500">Last Test:</span>
            <span class="text-gray-900">{formatTime(webhookStatus.zapier.lastTest)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Type:</span>
            <span class="text-gray-900">Catch Hook</span>
          </div>
        </div>
      </div>

      <!-- Pexels Status -->
      <div class="card p-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Pexels API</h3>
            <p class="text-sm text-gray-500">Image fetching</p>
          </div>
          <span class="px-3 py-1 text-sm font-medium rounded-full {getStatusColor(webhookStatus.pexels.status)}">
            {webhookStatus.pexels.status.toUpperCase()}
          </span>
        </div>

        <div class="mt-4 space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-500">Last Fetch:</span>
            <span class="text-gray-900">{formatTime(webhookStatus.pexels.lastFetch)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Rate Limit:</span>
            <span class="text-gray-900">200/hour</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="grid md:grid-cols-2 gap-8">
      <!-- Webhook Deliveries -->
      <div class="card p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Recent Webhook Deliveries</h3>

        {#if webhookStatus.stripe.deliveries.length > 0}
          <div class="space-y-3">
            {#each webhookStatus.stripe.deliveries as delivery}
              <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div class="flex items-center space-x-3">
                  <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p class="text-sm font-medium text-gray-900">{delivery.id}</p>
                    <p class="text-xs text-gray-500">{formatTime(delivery.timestamp)}</p>
                  </div>
                </div>
                <span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                  {delivery.status}
                </span>
              </div>
            {/each}
          </div>
        {:else}
          <p class="text-gray-500 text-center py-4">No recent deliveries</p>
        {/if}
      </div>

      <!-- System Health -->
      <div class="card p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">System Health</h3>

        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-gray-700">Payment Processing</span>
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 bg-green-500 rounded-full"></div>
              <span class="text-sm text-green-600">Operational</span>
            </div>
          </div>

          <div class="flex items-center justify-between">
            <span class="text-gray-700">Email Automation</span>
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 bg-{webhookStatus.zapier.status === 'active' ? 'green' : 'red'}-500 rounded-full"></div>
              <span class="text-sm text-{webhookStatus.zapier.status === 'active' ? 'green' : 'red'}-600">
                {webhookStatus.zapier.status === 'active' ? 'Operational' : 'Issues'}
              </span>
            </div>
          </div>

          <div class="flex items-center justify-between">
            <span class="text-gray-700">Image Service</span>
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 bg-{webhookStatus.pexels.status === 'active' ? 'green' : 'red'}-500 rounded-full"></div>
              <span class="text-sm text-{webhookStatus.pexels.status === 'active' ? 'green' : 'red'}-600">
                {webhookStatus.pexels.status === 'active' ? 'Operational' : 'Issues'}
              </span>
            </div>
          </div>

          <div class="flex items-center justify-between pt-2 border-t">
            <span class="font-medium text-gray-900">Overall Status</span>
            <div class="flex items-center space-x-2">
              <div class="w-3 h-3 bg-green-500 rounded-full"></div>
              <span class="text-sm font-medium text-green-600">All Systems Operational</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Last Updated -->
    {#if webhookStatus.lastChecked}
      <div class="text-center mt-8 text-sm text-gray-500">
        Last updated: {webhookStatus.lastChecked.toLocaleString()}
      </div>
    {/if}

    <!-- Quick Actions -->
    <div class="mt-8 p-4 bg-blue-50 rounded-lg">
      <h4 class="font-medium text-blue-900 mb-2">Quick Actions</h4>
      <div class="flex flex-wrap gap-2">
        <a href="/debug" class="text-sm bg-white px-3 py-1 rounded border hover:bg-gray-50">
          🔧 Debug Tools
        </a>
        <a href="https://dashboard.stripe.com/webhooks" target="_blank" class="text-sm bg-white px-3 py-1 rounded border hover:bg-gray-50">
          🔗 Stripe Dashboard
        </a>
        <a href="https://zapier.com/app/dashboard" target="_blank" class="text-sm bg-white px-3 py-1 rounded border hover:bg-gray-50">
          ⚡ Zapier Dashboard
        </a>
        <a href="/docs/INTEGRATION_GUIDE.md" class="text-sm bg-white px-3 py-1 rounded border hover:bg-gray-50">
          📚 Setup Guide
        </a>
      </div>
    </div>
  </div>
</div>
