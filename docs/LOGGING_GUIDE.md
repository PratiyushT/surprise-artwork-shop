# Logging System Guide

## Overview

The Surprise Artwork Shop includes a comprehensive logging system that provides detailed insights during development while maintaining clean, production-safe logs in production environments.

## Environment Control

Logging behavior is controlled by the `NODE_ENV` environment variable:

- **Development mode** (`NODE_ENV=development`): Full verbose logging with debug info, timers, and detailed context
- **Production mode** (`NODE_ENV=production`): Clean logging with only important info, warnings, and errors

## Logger Features

### Log Levels

```typescript
logger.debug()   // Development only - detailed debugging info
logger.info()    // Important information (both environments)
logger.warn()    // Warnings (both environments)
logger.error()   // Errors (both environments)
```

### Service-Specific Logging

```typescript
logger.stripe()  // Stripe-related operations
logger.pexels()  // Pexels API operations
logger.zapier()  // Zapier webhook operations
logger.webhook() // General webhook operations
logger.payment() // Payment flow operations
```

### Performance Monitoring

```typescript
const endTimer = logger.startTimer('Operation name');
// ... your code ...
endTimer(); // Logs execution time in development
```

### Request/Response Logging

```typescript
logger.request('POST', '/api/endpoint', { data: 'context' });
logger.response(200, '/api/endpoint', { success: true });
```

## Usage Examples

### Basic Logging

```typescript
import { logger } from '$lib/logger';

// Information logging
logger.info('User selected pricing tier', {
  tier: 'premium',
  price: 19.99,
  userId: 'user123'
});

// Debug logging (development only)
logger.debug('Processing payment data', {
  sessionId: 'cs_123',
  amount: 1999,
  currency: 'usd'
});

// Error logging
logger.error('Payment processing failed', {
  sessionId: 'cs_123',
  error: 'Invalid card',
  tier: 'premium'
});
```

### Service-Specific Logging

```typescript
// Stripe operations
logger.stripe('Creating checkout session', {
  tier: 'premium',
  amount: 1999
});

// Pexels operations
logger.pexels('Fetching random image', {
  query: 'nature art',
  page: 1
});

// Zapier operations
logger.zapier('Sending purchase data', {
  customerEmail: 'user@example.com',
  tier: 'premium'
});
```

### Performance Monitoring

```typescript
import { logger } from '$lib/logger';

async function processPayment(sessionId: string) {
  const endTimer = logger.startTimer('Payment processing');

  try {
    // Your payment processing code here
    await stripeService.processPayment(sessionId);

    logger.info('Payment processed successfully', { sessionId });
  } catch (error) {
    logger.error('Payment processing failed', { sessionId, error });
  } finally {
    endTimer(); // Logs execution time
  }
}
```

### Error Handling

```typescript
import { logError } from '$lib/logger';

try {
  await riskyOperation();
} catch (error) {
  logError(error as Error, {
    action: 'risky operation',
    userId: 'user123',
    additionalContext: 'any relevant data'
  });
  throw error; // Re-throw if needed
}
```

### Helper Functions

```typescript
import {
  logWebhookEvent,
  logPaymentFlow,
  logAPICall,
  devLog,
  prodLog
} from '$lib/logger';

// Webhook event logging
logWebhookEvent('checkout.session.completed', sessionId, {
  customerEmail: 'user@example.com'
});

// Payment flow logging
logPaymentFlow('Processing payment', sessionId, {
  amount: 1999,
  currency: 'usd'
});

// API call logging
logAPICall('pexels', 'fetch random image', {
  query: 'nature',
  page: 1
});

// Development-only logging
devLog('Debug information', { data: complexObject });

// Production-safe logging
prodLog('error', 'Critical error occurred', { context: 'data' });
```

## Log Output Examples

### Development Mode

```
[2024-01-15T10:30:15.123Z] DEBUG 🔧 Initializing Stripe service | Context: {"apiVersion":"2024-12-18.acacia","keyPrefix":"sk_test_..."}

[2024-01-15T10:30:15.125Z] INFO  [STRIPE] Service initialized successfully

[2024-01-15T10:30:15.130Z] INFO  [STRIPE] Creating checkout session | Context: {"tier":"Premium Surprise","tierPrice":19.99,"tipAmount":2,"totalAmount":21.99,"baseUrl":"http://localhost:5173"}

[2024-01-15T10:30:15.135Z] DEBUG ⏱️  Started timer: Stripe checkout session creation

[2024-01-15T10:30:15.140Z] DEBUG 💰 Price conversion | Context: {"tierPriceDollars":19.99,"tierPriceCents":1999,"tipAmountDollars":2,"tipAmountCents":200}

[2024-01-15T10:30:15.250Z] INFO  [STRIPE] Checkout session created successfully | Context: {"sessionId":"cs_test_123","url":"https://checkout.stripe.com/pay/cs_test_123","status":"open","totalAmount":2199}

[2024-01-15T10:30:15.251Z] DEBUG ⏱️  Finished timer: Stripe checkout session creation | Context: {"duration":"116ms"}
```

### Production Mode

```
[2024-01-15T10:30:15.125Z] INFO  [STRIPE] Service initialized successfully

[2024-01-15T10:30:15.130Z] INFO  [STRIPE] Creating checkout session | Context: {"tier":"Premium Surprise","tierPrice":19.99,"tipAmount":2,"totalAmount":21.99}

[2024-01-15T10:30:15.250Z] INFO  [STRIPE] Checkout session created successfully | Context: {"sessionId":"cs_test_123","totalAmount":2199}
```

## Best Practices

### 1. Use Appropriate Log Levels

```typescript
// ✅ Good
logger.debug('Processing intermediate data', { data });  // Development details
logger.info('User completed purchase', { userId, amount }); // Important events
logger.warn('API rate limit approaching', { remaining: 10 }); // Potential issues
logger.error('Payment failed', { error, sessionId }); // Actual problems

// ❌ Avoid
logger.info('Processing loop iteration 247'); // Too verbose
logger.error('User clicked button'); // Not an error
```

### 2. Provide Meaningful Context

```typescript
// ✅ Good
logger.info('Webhook processed successfully', {
  eventType: 'checkout.session.completed',
  sessionId: session.id,
  customerEmail: session.customer_details?.email,
  amount: session.amount_total,
  processingTime: '150ms'
});

// ❌ Avoid
logger.info('Webhook processed'); // Too vague
```

### 3. Use Timers for Performance Monitoring

```typescript
// ✅ Good
const endTimer = logger.startTimer('Database query');
const results = await db.query(sql);
endTimer();

// Include in error handling
try {
  const endTimer = logger.startTimer('API call');
  const result = await apiCall();
  endTimer();
  return result;
} catch (error) {
  endTimer(); // Still log timing even on error
  throw error;
}
```

### 4. Sanitize Sensitive Data

```typescript
// ✅ Good
logger.info('Processing payment', {
  sessionId: 'cs_123',
  amount: 1999,
  currency: 'usd',
  cardLast4: '4242' // Only last 4 digits
});

// ❌ Avoid
logger.info('Processing payment', {
  cardNumber: '4242424242424242', // Full card number
  apiKey: 'sk_live_abc123' // API keys
});
```

### 5. Log at Integration Boundaries

```typescript
// ✅ Good - Log before and after external calls
logger.request('POST', 'https://api.pexels.com/v1/search');
const response = await fetch(pexelsUrl);
logger.response(response.status, 'https://api.pexels.com/v1/search');

// Log service initialization
logger.stripe('Service initialized successfully');

// Log critical business events
logger.payment('Purchase completed successfully', sessionId);
```

## Configuration

### Environment Variables

Set in your `.env` file:

```env
NODE_ENV=development  # or 'production'
```

### Customizing Log Behavior

The logger automatically adjusts based on `NODE_ENV`:

- **Development**: All log levels, timers, detailed context
- **Production**: Info/warn/error only, no debug logs, no timers

## Integration with Monitoring

### Development

- All logs appear in console with timestamps and context
- Performance timers help identify bottlenecks
- Debug logs provide detailed execution flow

### Production

- Clean, structured logs suitable for log aggregation
- Only meaningful events logged
- Errors include full context for debugging
- Performance logs excluded to reduce noise

## Troubleshooting

### Common Issues

1. **Logs not appearing in development**
   - Check `NODE_ENV=development` in `.env`
   - Verify logger import: `import { logger } from '$lib/logger'`

2. **Too much logging in production**
   - Ensure `NODE_ENV=production`
   - Use appropriate log levels (avoid `debug` for production)

3. **Missing context in logs**
   - Always provide relevant context objects
   - Include identifiers like `sessionId`, `userId`, etc.

### Debug Logging

Use the `/debug` endpoint to test logging:

```bash
curl -X POST http://localhost:5173/api/debug/test-webhook
```

This will generate comprehensive logs showing the logging system in action.

## Examples in Codebase

Check these files for logging examples:

- `src/lib/services/stripe.ts` - Stripe service logging
- `src/lib/services/pexels.ts` - Pexels API logging
- `src/lib/services/zapier.ts` - Zapier webhook logging
- `src/routes/api/webhook/+server.ts` - Webhook processing logging
- `src/routes/api/debug/test-webhook/+server.ts` - Debug logging

The logging system ensures you have full visibility during development while maintaining clean, production-ready logs for monitoring and debugging.
