// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

// Environment variables types
declare namespace NodeJS {
	interface ProcessEnv {
		STRIPE_PUBLISHABLE_KEY: string;
		STRIPE_SECRET_KEY: string;
		STRIPE_WEBHOOK_SECRET: string;
		PEXELS_KEY: string;
		ZAPIER_WEBHOOK_URL: string;
		ZAPIER_SECRET_KEY: string;
		PUBLIC_SITE_URL: string;
		NODE_ENV: 'development' | 'production';
	}
}

// App types
export interface PricingTier {
	id: string;
	name: string;
	price: number;
	description: string;
	features: string[];
}

export interface PexelsImage {
	id: number;
	width: number;
	height: number;
	url: string;
	photographer: string;
	photographer_url: string;
	photographer_id: number;
	avg_color: string;
	src: {
		original: string;
		large2x: string;
		large: string;
		medium: string;
		small: string;
		portrait: string;
		landscape: string;
		tiny: string;
	};
}

export interface PurchaseData {
	customer_email: string;
	tier: PricingTier;
	tip_amount: number;
	total_amount: number;
	stripe_session_id: string;
	image: PexelsImage;
	purchase_date: string;
}

export {};
