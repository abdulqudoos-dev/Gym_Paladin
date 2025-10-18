/**
 * Test Script for Payhip Webhook Integration
 * 
 * This script helps you test the webhook integration without needing Payhip.
 * Make sure your server is running before executing this script.
 * 
 * Usage:
 *   node test-webhook.js
 */

const testWebhookEndpoint = async () => {
  console.log('\n🧪 Testing Payhip Webhook Integration\n');
  console.log('=' .repeat(60));

  // Test 1: Check if webhook endpoint exists
  console.log('\n📍 Test 1: Checking webhook endpoint status...');
  try {
    const response = await fetch('http://localhost:5000/api/webhooks/test');
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Webhook endpoint is active');
      console.log('   Endpoint:', data.endpoint);
      console.log('   Supported events:', data.supportedEvents.join(', '));
    } else {
      console.log('❌ Webhook endpoint not responding correctly');
    }
  } catch (error) {
    console.log('❌ Cannot connect to webhook endpoint');
    console.log('   Error:', error.message);
    console.log('   Make sure your server is running on port 5000');
    return;
  }

  // Test 2: Test paid event (subscription payment)
  console.log('\n📍 Test 2: Testing "paid" webhook event...');
  console.log('⚠️  Note: Make sure the user email exists in your database!');
  
  const paidEventData = {
    event: 'paid',
    buyer_email: 'test@example.com', // CHANGE THIS to an existing user email
    buyer_name: 'Test User',
    product_id: 'foundations-monthly',
    transaction_id: `TEST-${Date.now()}`,
    amount: '12.00',
    currency: 'USD',
    subscription_id: `sub-test-${Date.now()}`,
    customer_id: `cus-test-${Date.now()}`
  };

  try {
    const response = await fetch('http://localhost:5000/api/webhooks/payhip', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paidEventData)
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Paid event processed successfully');
      console.log('   User subscription should now be active');
      console.log('   Check MongoDB to verify subscription records');
    } else {
      console.log('⚠️  Paid event received but processing had issues');
      console.log('   Message:', data.message);
      console.log('   This is normal if the user email doesn\'t exist');
    }
  } catch (error) {
    console.log('❌ Error testing paid event');
    console.log('   Error:', error.message);
  }

  // Test 3: Test subscription.created event
  console.log('\n📍 Test 3: Testing "subscription.created" event...');
  
  const subscriptionCreatedData = {
    event: 'subscription.created',
    buyer_email: 'test@example.com', // CHANGE THIS
    subscription_id: `sub-test-${Date.now()}`,
    product_id: 'advanced-monthly'
  };

  try {
    const response = await fetch('http://localhost:5000/api/webhooks/payhip', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscriptionCreatedData)
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Subscription created event processed');
    } else {
      console.log('⚠️  Subscription created event had issues');
      console.log('   Message:', data.message);
    }
  } catch (error) {
    console.log('❌ Error testing subscription created');
    console.log('   Error:', error.message);
  }

  // Test 4: Check subscription API endpoint
  console.log('\n📍 Test 4: Testing subscription API endpoints...');
  
  try {
    const response = await fetch('http://localhost:5000/api/subscriptions/plans');
    const data = await response.json();
    
    if (data.success && data.plans) {
      console.log('✅ Subscription API is working');
      console.log('   Available plans:', data.plans.length);
      data.plans.forEach(plan => {
        console.log(`   - ${plan.name}: $${plan.monthlyPrice}/month`);
      });
    } else {
      console.log('❌ Subscription API not responding correctly');
    }
  } catch (error) {
    console.log('❌ Error testing subscription API');
    console.log('   Error:', error.message);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Summary');
  console.log('\n✅ If all tests passed:');
  console.log('   1. Webhook endpoint is active and ready');
  console.log('   2. Subscription system is functional');
  console.log('   3. You can now configure Payhip webhook URL');
  console.log('\n⚠️  If tests failed:');
  console.log('   1. Make sure backend server is running (npm start)');
  console.log('   2. Check MongoDB connection');
  console.log('   3. Verify user email exists for paid event tests');
  console.log('\n🔗 Next Steps:');
  console.log('   1. Update Payhip webhook URL to: http://localhost:5000/api/webhooks/payhip');
  console.log('   2. Enable webhook events: paid, subscription.created, subscription.deleted, refunded');
  console.log('   3. Create products in Payhip dashboard');
  console.log('   4. Test with a real payment\n');
};

// Run the test
testWebhookEndpoint().catch(console.error);

