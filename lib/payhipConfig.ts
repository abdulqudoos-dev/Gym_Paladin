/**
 * Payhip Product Configuration
 * 
 * Add your actual Payhip product IDs from your Payhip dashboard
 * Format: https://payhip.com/b/YOUR_PRODUCT_ID
 */

export const PAYHIP_PRODUCTS = {
  foundations: {
    monthly: 'XXXXX', // Replace with your Payhip product ID
    yearly: 'XXXXX',  // Replace with your Payhip product ID
  },
  advanced: {
    monthly: 'XXXXX', // Replace with your Payhip product ID
    yearly: 'XXXXX',  // Replace with your Payhip product ID
  },
  custom: {
    monthly: 'XXXXX', // Replace with your Payhip product ID
    yearly: 'XXXXX',  // Replace with your Payhip product ID
  }
};

/**
 * Get Payhip checkout URL for a plan
 */
export function getPayhipCheckoutUrl(
  plan: 'foundations' | 'advanced' | 'custom',
  billingCycle: 'monthly' | 'yearly' = 'monthly',
  userEmail?: string
): string {
  const productId = PAYHIP_PRODUCTS[plan][billingCycle];
  
  // Base Payhip URL
  let url = `https://payhip.com/b/${productId}`;
  
  // Add user email if provided (pre-fill)
  if (userEmail) {
    url += `?email=${encodeURIComponent(userEmail)}`;
  }
  
  return url;
}

/**
 * Check if Payhip products are configured
 */
export function arePayhipProductsConfigured(): boolean {
  return Object.values(PAYHIP_PRODUCTS).every(plan => 
    Object.values(plan).every(id => id !== 'XXXXX')
  );
}

