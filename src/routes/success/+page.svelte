<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  let sessionId = '';
  let isLoading = true;
  let purchaseData: any = null;
  let error = '';

  onMount(() => {
    sessionId = $page.url.searchParams.get('session_id') || '';
    if (sessionId) {
      // In a real implementation, you might fetch purchase details
      // For now, we'll show a generic success message
      isLoading = false;
    } else {
      error = 'No session ID provided';
      isLoading = false;
    }
  });
</script>

<svelte:head>
  <title>Purchase Successful - Surprise Artwork Shop</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
  <div class="max-w-4xl mx-auto px-4 py-16">
    {#if isLoading}
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p class="text-gray-600">Processing your purchase...</p>
      </div>
    {:else if error}
      <div class="card p-8 text-center">
        <div class="text-red-500 text-6xl mb-4">❌</div>
        <h1 class="text-3xl font-bold text-gray-900 mb-4">Something went wrong</h1>
        <p class="text-gray-600 mb-6">{error}</p>
        <a href="/" class="btn-primary inline-block">Return to Shop</a>
      </div>
    {:else}
      <div class="text-center mb-8">
        <div class="text-green-500 text-6xl mb-4">✅</div>
        <h1 class="text-4xl font-bold text-gray-900 mb-4">Purchase Successful!</h1>
        <p class="text-xl text-gray-600">
          Thank you for your purchase! Your surprise artwork is being prepared.
        </p>
      </div>

      <div class="grid md:grid-cols-2 gap-8 mb-8">
        <div class="card p-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">What happens next?</h2>
          <div class="space-y-4">
            <div class="flex items-start space-x-3">
              <div class="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
              <div>
                <h3 class="font-semibold text-gray-900">Payment Confirmed</h3>
                <p class="text-gray-600 text-sm">Your payment has been securely processed.</p>
              </div>
            </div>

            <div class="flex items-start space-x-3">
              <div class="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
              <div>
                <h3 class="font-semibold text-gray-900">Artwork Selected</h3>
                <p class="text-gray-600 text-sm">A beautiful, high-quality artwork has been curated just for you.</p>
              </div>
            </div>

            <div class="flex items-start space-x-3">
              <div class="flex-shrink-0 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
              <div>
                <h3 class="font-semibold text-gray-900">Email Delivery</h3>
                <p class="text-gray-600 text-sm">You'll receive an email with your artwork and download links shortly.</p>
              </div>
            </div>
          </div>
        </div>

        <div class="card p-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Purchase Details</h2>
          <div class="space-y-3">
            <div class="flex justify-between">
              <span class="text-gray-600">Session ID:</span>
              <span class="font-mono text-sm text-gray-800">{sessionId.slice(0, 20)}...</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Purchase Date:</span>
              <span class="text-gray-800">{new Date().toLocaleDateString()}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Status:</span>
              <span class="text-green-600 font-semibold">Completed</span>
            </div>
          </div>
        </div>
      </div>

      <div class="card p-8 text-center">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Check Your Email</h2>
        <p class="text-gray-600 mb-6">
          We've sent a confirmation email with your purchase details and artwork download links.
          If you don't see it in your inbox, please check your spam folder.
        </p>

        <div class="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
          <a href="/" class="btn-primary inline-block">Purchase Another Artwork</a>
          <a href="mailto:support@surpriseartworkshop.com" class="btn-secondary inline-block">Contact Support</a>
        </div>
      </div>

      <div class="text-center mt-8">
        <p class="text-gray-500 text-sm">
          Having issues? Contact us at
          <a href="mailto:support@surpriseartworkshop.com" class="text-primary-600 hover:underline">
            support@surpriseartworkshop.com
          </a>
        </p>
      </div>
    {/if}
  </div>
</div>
