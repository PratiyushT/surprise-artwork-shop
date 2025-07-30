# Surprise Artwork Shop

A fast, production-grade SvelteKit web application that lets users purchase surprise digital artworks through a seamless payment experience powered by Stripe, Pexels API, and Zapier automation.

## 🎨 Features

- **Multiple Pricing Tiers**: Basic ($9.99), Premium ($19.99), and Deluxe ($39.99) surprise artwork packages
- **Optional Tipping**: Support photographers with customizable tips
- **Stripe Integration**: Secure payment processing with Stripe Checkout
- **Webhook Processing**: Automated fulfillment via Stripe webhooks
- **Random Artwork**: Dynamic image fetching from Pexels API based on tier selection
- **Zapier Automation**: Automatic data forwarding to Zapier for further processing
- **Responsive Design**: Mobile-first, responsive UI with Tailwind CSS
- **TypeScript**: Full type safety throughout the application
- **Production Ready**: Optimized for scalability and performance

## 🛠️ Tech Stack

- **Frontend**: SvelteKit 2.x with TypeScript
- **Styling**: Tailwind CSS 4.x
- **Package Manager**: Bun (recommended) or pnpm
- **Payment Processing**: Stripe API v2024-12-18
- **Image API**: Pexels API v1
- **Automation**: Zapier Webhooks
- **Environment**: .env configuration

## 📦 Installation

1. **Clone and install dependencies:**
   ```bash
   cd surprise-artwork-shop
   bun install
   ```

2. **Set up environment variables:**
   Copy `.env.example` to `.env` and fill in your API keys:
   ```bash
   cp .env.example .env
   ```

   Required environment variables:
   ```env
   # Stripe Configuration
   STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

   # Pexels API
   PEXELS_KEY=your_pexels_api_key_here

   # Zapier Webhook
   ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/your_zapier_webhook_url
   ZAPIER_SECRET_KEY=your_zapier_secret_key_here

   # App Configuration
   PUBLIC_SITE_URL=http://localhost:5173
   ```

3. **Start the development server:**
   ```bash
   bun run dev
   ```

## 🔧 Configuration

### Pricing Tiers
Pricing tiers are configured in `src/lib/config.ts`:
- Prices are in cents (999 = $9.99)
- Each tier has customizable features and descriptions
- Pexels search queries are tier-specific for varied artwork

### Stripe Setup
1. Create a Stripe account and get your API keys
2. Set up a webhook endpoint pointing to `/api/webhook`
3. Configure the webhook to listen for `checkout.session.completed` events
4. Copy the webhook secret to your environment variables

### Pexels Setup
1. Get a free API key from [Pexels](https://www.pexels.com/api/)
2. Add the API key to your environment variables
3. Customize search queries in `src/lib/config.ts`

### Zapier Setup
1. Create a Zapier webhook trigger
2. Set up your desired automation workflow
3. Add the webhook URL and secret key to environment variables

## 🔄 Workflow

1. **Customer selects tier** → Pricing tier selection with optional tip
2. **Stripe Checkout** → Secure payment processing
3. **Webhook triggered** → `checkout.session.completed` event
4. **Image fetching** → Random artwork from Pexels based on tier
5. **Data forwarding** → Purchase data sent to Zapier webhook
6. **Customer fulfillment** → Automated email delivery via Zapier

## 📁 Project Structure

```
src/
├── app.d.ts                 # TypeScript definitions
├── app.css                  # Global styles with Tailwind
├── lib/
│   ├── config.ts           # App configuration
│   └── services/
│       ├── stripe.ts       # Stripe payment service
│       ├── pexels.ts       # Pexels image service
│       └── zapier.ts       # Zapier webhook service
└── routes/
    ├── +layout.svelte      # App layout
    ├── +page.svelte        # Main purchase page
    ├── success/
    │   └── +page.svelte    # Success page
    └── api/
        ├── create-checkout-session/
        │   └── +server.ts  # Stripe checkout endpoint
        └── webhook/
            └── +server.ts  # Stripe webhook handler
```

## 🚀 Deployment

### Environment Setup
1. Set `PUBLIC_SITE_URL` to your production domain
2. Update Stripe webhook endpoint URL
3. Ensure all API keys are production-ready

### Build and Deploy
```bash
bun run build
```

The app is configured for deployment on platforms like:
- Netlify (with serverless functions)
- Vercel
- Any Node.js hosting platform

## 🔐 Security Features

- **Webhook Verification**: Stripe webhook signatures are verified
- **Environment Variables**: Sensitive data stored in environment variables
- **Type Safety**: Full TypeScript coverage prevents runtime errors
- **Secure Headers**: Zapier webhooks use Bearer token authentication
- **Input Validation**: All user inputs are validated

## 🧪 Testing

### Manual Testing
1. Start the dev server
2. Select a pricing tier
3. Add optional tip
4. Click "Purchase Now"
5. Complete Stripe checkout with test card: `4242 4242 4242 4242`
6. Verify webhook processing in logs
7. Check Zapier automation

### Test Cards
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **3D Secure**: 4000 0027 6000 3184

## 📊 Monitoring

The application logs:
- Payment processing events
- Pexels API calls and responses
- Zapier webhook delivery status
- Error handling and debugging information

## 🆘 Troubleshooting

### Common Issues

1. **Webhook not triggering**:
   - Check Stripe webhook configuration
   - Verify endpoint URL is accessible
   - Check webhook secret key

2. **Pexels images not loading**:
   - Verify API key is valid
   - Check API rate limits
   - Review search query configuration

3. **Zapier automation not running**:
   - Verify webhook URL and secret key
   - Check Zapier webhook logs
   - Ensure data format matches expectations

## 📝 License

This project is for demonstration purposes. Ensure you have proper licenses for:
- Stripe payment processing
- Pexels API usage
- Any commercial deployment

## 🤝 Support

For technical support or questions:
- Check the application logs for detailed error messages
- Review Stripe dashboard for payment issues
- Verify API key configurations
- Test with webhook debugging tools
