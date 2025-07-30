# Stripe + Zapier Integration Guide

## 🎯 Overview

This guide shows you how to integrate Stripe webhooks with Zapier automation for the Surprise Artwork Shop. When a customer completes a purchase, the flow works like this:

1. **Customer pays** → Stripe processes payment
2. **Stripe webhook** → Triggers our app's webhook endpoint
3. **Pexels API** → Fetches random artwork based on tier
4. **Zapier webhook** → Sends purchase data for automated fulfillment
5. **Customer receives** → Automated email with artwork and details

## 🔗 Part 1: Stripe Webhook Setup

### Step 1: Create Stripe Webhook Endpoint

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com/webhooks
2. **Click "Add endpoint"**
3. **Set endpoint URL**: `https://your-domain.netlify.app/api/webhook`
4. **Select events to listen for**:
   ```
   ✅ checkout.session.completed
   ```
5. **Click "Add endpoint"**

### Step 2: Get Webhook Secret

1. **Click on your newly created webhook**
2. **Copy the "Signing secret"** (starts with `whsec_`)
3. **Add to your environment variables**:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

### Step 3: Test Stripe Webhook

```bash
# Install Stripe CLI for local testing
curl -s https://packages.stripe.com/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.com/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
sudo apt update
sudo apt install stripe

# Login to Stripe
stripe login

# Forward webhooks to local development
stripe listen --forward-to localhost:5173/api/webhook
```

## 🔗 Part 2: Zapier Webhook Setup

### Step 1: Create Zapier Webhook

1. **Go to Zapier**: https://zapier.com
2. **Create new Zap**
3. **Choose trigger**: "Webhooks by Zapier"
4. **Select**: "Catch Hook"
5. **Copy the webhook URL** (looks like: `https://hooks.zapier.com/hooks/catch/123456/abcdef`)

### Step 2: Configure Webhook Authentication

1. **In Zapier webhook settings**
2. **Add custom authentication**:
   ```
   Header Name: Authorization
   Header Value: Bearer YOUR_SECRET_KEY
   ```
3. **Generate a secret key** (random string):
   ```bash
   # Generate random secret
   openssl rand -hex 32
   ```

### Step 3: Set Environment Variables

```env
# Add to your .env file
ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/123456/abcdef
ZAPIER_SECRET_KEY=your_generated_secret_key_here
```

## 🔗 Part 3: Test the Integration

### Test Webhook Data Format

The app sends this JSON structure to Zapier:

```json
{
  "customer_email": "customer@example.com",
  "tier": {
    "id": "premium",
    "name": "Premium Surprise",
    "price": 19.99
  },
  "tip_amount": 2.00,
  "total_amount": 21.99,
  "stripe_session_id": "cs_test_...",
  "image": {
    "id": 12345,
    "url": "https://images.pexels.com/photos/12345/photo.jpg",
    "photographer": "John Doe",
    "photographer_url": "https://www.pexels.com/@johndoe",
    "width": 1920,
    "height": 1080,
    "src": {
      "original": "https://images.pexels.com/photos/12345/photo.jpg",
      "large": "https://images.pexels.com/photos/12345/photo-large.jpg"
    }
  },
  "purchase_date": "2024-01-15T10:30:00.000Z",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "source": "surprise-artwork-shop"
}
```

### Manual Test with cURL

```bash
# Test your Zapier webhook manually
curl -X POST https://hooks.zapier.com/hooks/catch/123456/abcdef \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_secret_key" \
  -d '{
    "test": true,
    "customer_email": "test@example.com",
    "tier": {"id": "basic", "name": "Basic Surprise", "price": 9.99},
    "tip_amount": 1.00,
    "total_amount": 10.99,
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"
  }'
```

## 🔗 Part 4: Zapier Automation Setup

### Step 1: Process Webhook Data

1. **Test your webhook** with the cURL command above
2. **Zapier will capture the test data**
3. **Map the fields** you want to use:
   - `customer_email` → Email recipient
   - `tier.name` → Product name
   - `total_amount` → Purchase amount
   - `image.url` → Artwork URL
   - `image.photographer` → Artist credit

### Step 2: Create Email Action

1. **Add action**: "Email by Zapier" or "Gmail"
2. **Configure email template**:

```html
Subject: Your Surprise Artwork is Ready! 🎨

Dear Customer,

Thank you for your purchase of {{tier.name}} for ${{total_amount}}!

Your surprise artwork is ready for download:

🎨 **Your Artwork**: {{image.url}}
📸 **Photographer**: {{image.photographer}}
🔗 **Artist Profile**: {{image.photographer_url}}

**Download Options:**
- Original: {{image.src.original}}
- Large: {{image.src.large}}

**Purchase Details:**
- Order ID: {{stripe_session_id}}
- Date: {{purchase_date}}
- Tier: {{tier.name}}
- Total: ${{total_amount}}

Enjoy your beautiful artwork!

Best regards,
Surprise Artwork Shop
```

### Step 3: Additional Actions (Optional)

Add more automation steps:
- **Google Sheets**: Log purchases
- **Slack**: Notify team of sales
- **Mailchimp**: Add customer to newsletter
- **Airtable**: Customer management

## 🔍 Part 5: Testing & Verification

### 5.1 Test Payment Flow

1. **Use Stripe test cards**:
   ```
   Success: 4242 4242 4242 4242
   Decline: 4000 0000 0000 0002
   3D Secure: 4000 0027 6000 3184
   ```

2. **Complete a test purchase**
3. **Check webhook logs**

### 5.2 Monitor Webhook Delivery

**Stripe Dashboard Monitoring:**
1. Go to **Webhooks** in Stripe Dashboard
2. Click on your webhook endpoint
3. Check **"Recent deliveries"** tab
4. Look for `checkout.session.completed` events
5. Verify response status: `200 OK`

**Example Successful Log:**
```json
{
  "id": "evt_test_webhook",
  "object": "event",
  "type": "checkout.session.completed",
  "created": 1642248000,
  "data": {
    "object": {
      "id": "cs_test_...",
      "customer_details": {
        "email": "customer@example.com"
      },
      "metadata": {
        "tier_id": "premium",
        "tier_name": "Premium Surprise",
        "tier_price": "19.99",
        "tip_amount": "2.00",
        "total_amount": "21.99"
      }
    }
  }
}
```

### 5.3 Zapier Webhook Monitoring

1. **Go to Zapier Dashboard**
2. **Click on your Zap**
3. **Check "Zap Runs"** tab
4. **Look for recent executions**
5. **Verify data received correctly**

### 5.4 Application Logs

**Check your app logs for:**

```javascript
// Successful webhook processing
console.log('Successfully processed purchase:', {
  sessionId: session.id,
  customerEmail: purchaseData.customer_email,
  tier: tierData.name,
  totalAmount: totalAmount,
  imageId: image.id,
  zapierSent: zapierResult.success
});
```

**Error logs to watch for:**
```javascript
// Webhook verification failed
console.error('Webhook signature verification failed:', error);

// Pexels API failed
console.error('Failed to fetch image from Pexels');

// Zapier webhook failed
console.error('Failed to send data to Zapier:', zapierResult.error);
```

## 🚨 Troubleshooting Common Issues

### Issue 1: Webhook Not Triggering

**Check:**
- ✅ Correct webhook URL in Stripe
- ✅ `checkout.session.completed` event selected
- ✅ Webhook endpoint is publicly accessible
- ✅ No firewall blocking requests

**Debug:**
```bash
# Test webhook endpoint directly
curl -X POST https://your-domain.netlify.app/api/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### Issue 2: Webhook Signature Verification Failed

**Check:**
- ✅ Correct `STRIPE_WEBHOOK_SECRET` in environment
- ✅ Secret matches the one in Stripe Dashboard
- ✅ Raw request body used for verification

### Issue 3: Zapier Not Receiving Data

**Check:**
- ✅ Correct `ZAPIER_WEBHOOK_URL`
- ✅ Zapier webhook is "on" and active
- ✅ Authorization header format: `Bearer YOUR_SECRET`
- ✅ JSON content-type header

**Test Zapier webhook:**
```bash
curl -X POST YOUR_ZAPIER_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SECRET" \
  -d '{"test": true, "message": "Hello Zapier!"}'
```

### Issue 4: Pexels Images Not Loading

**Check:**
- ✅ Valid `PEXELS_KEY` in environment
- ✅ API rate limits not exceeded
- ✅ Search queries returning results

**Test Pexels API:**
```bash
curl -H "Authorization: YOUR_PEXELS_KEY" \
  "https://api.pexels.com/v1/search?query=nature&per_page=1"
```

## 📊 Success Indicators

**✅ Everything is working when you see:**

1. **Stripe Dashboard**: Webhook deliveries show `200` status
2. **Application Logs**: "Successfully processed purchase" messages
3. **Zapier Dashboard**: Zap runs show successful executions
4. **Customer receives**: Automated email with artwork
5. **No error logs** in your application

## 🔄 Production Checklist

Before going live:

- [ ] Switch to Stripe live keys
- [ ] Update webhook endpoint to production URL
- [ ] Test with real (small) payment
- [ ] Verify Zapier automation works with live data
- [ ] Set up monitoring/alerting for failed webhooks
- [ ] Document the process for your team

## 🎉 Next Steps

Once everything is working:
- Set up monitoring dashboards
- Create backup webhook endpoints
- Add more Zapier automation actions
- Scale your artwork delivery process
- Monitor conversion rates and optimize
