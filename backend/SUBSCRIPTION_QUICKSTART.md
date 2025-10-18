# Payhip Subscription - Quick Start Guide

## ✅ What Has Been Implemented

### Database Models
1. **User Model** - Extended with Payhip subscription fields
2. **Subscription Model** - Updated to support Payhip transactions
3. **Payment Model** - NEW - Tracks all payment transactions

### Backend Services
1. **Subscription Service** - Business logic for subscription management
2. **Webhook Handler** - Processes Payhip webhook events
3. **Subscription API Routes** - REST endpoints for subscription management

### API Endpoints Created
```
POST   /api/webhooks/payhip          # Payhip webhook receiver
GET    /api/webhooks/test            # Test webhook endpoint

GET    /api/subscriptions/me         # Get user subscription
GET    /api/subscriptions/payments   # Get payment history
POST   /api/subscriptions/cancel     # Cancel subscription
POST   /api/subscriptions/reactivate # Reactivate subscription
GET    /api/subscriptions/plans      # Get available plans

GET    /api/subscriptions            # Admin: Get all subscriptions
GET    /api/subscriptions/stats      # Admin: Get statistics
```

## 🚀 How to Start

### 1. Make Sure Your Backend .env File Has:
```env
PAYHIP_API_KEY=abc
MONGODB_URI=mongodb://localhost:27017/fitmaker
FRONTEND_URL=http://localhost:3000
PORT=5000
```

### 2. Start Your Backend Server
```bash
cd backend
npm install
npm start
```

You should see:
```
✅ MongoDB connected successfully
🚀 Server running on port 5000
```

### 3. Configure Payhip Webhook

**Webhook URL (for local testing with ngrok):**
```
https://your-ngrok-url.ngrok.io/api/webhooks/payhip
```

**Webhook URL (for production):**
```
https://yourdomain.com/api/webhooks/payhip
```

**Enable these events in Payhip:**
- ✅ paid
- ✅ subscription.created
- ✅ subscription.deleted
- ✅ refunded

### 4. Test the Integration

#### Test 1: Check Webhook Endpoint is Active
```bash
curl http://localhost:5000/api/webhooks/test
```

Expected response:
```json
{
  "success": true,
  "message": "Webhook endpoint is active",
  "endpoint": "/api/webhooks/payhip",
  "supportedEvents": ["paid", "subscription.created", "subscription.deleted", "refunded"]
}
```

#### Test 2: Simulate a Payment (Manual Test)
```bash
curl -X POST http://localhost:5000/api/webhooks/payhip \
  -H "Content-Type: application/json" \
  -d '{
    "event": "paid",
    "buyer_email": "user@example.com",
    "buyer_name": "Test User",
    "product_id": "foundations-monthly",
    "transaction_id": "TEST-001",
    "amount": "12.00",
    "currency": "USD",
    "subscription_id": "sub-test-001",
    "customer_id": "cus-test-001"
  }'
```

**Note:** The user email must exist in your database first!

## 📊 How It Works

### When a User Subscribes on Payhip:

1. **User completes payment on Payhip**
   - Payhip processes the payment
   
2. **Payhip sends webhook to your server**
   - POST request to `/api/webhooks/payhip`
   - Contains transaction data and buyer info
   
3. **Your server processes the webhook**
   - Finds user by email
   - Determines plan from product ID or amount
   - Updates user subscription in database
   - Creates subscription record
   - Creates payment record
   
4. **User gains access**
   - User.subscription.status = 'active'
   - User.subscription.plan = 'foundations'/'advanced'/'custom'
   - Access granted to premium features

### Plan Mapping

| Payhip Product | Amount | Plan | Billing |
|---------------|--------|------|---------|
| foundations-monthly | $12 | foundations | monthly |
| foundations-yearly | $120 | foundations | yearly |
| advanced-monthly | $25 | advanced | monthly |
| advanced-yearly | $250 | advanced | yearly |
| custom-monthly | $50 | custom | monthly |
| custom-yearly | $500 | custom | yearly |

## 🔍 Monitoring Subscriptions

### Check User Subscription Status
```javascript
// In MongoDB or via API
db.users.findOne({ email: "user@example.com" }, { subscription: 1 })
```

### View All Subscriptions
```javascript
db.subscriptions.find().sort({ createdAt: -1 })
```

### View Payment History
```javascript
db.payments.find({ user: userId }).sort({ createdAt: -1 })
```

## 🎯 Frontend Integration (Next Steps)

You'll need to add Payhip checkout buttons to your pricing page:

```jsx
// In your pricing page component
<a 
  href="https://payhip.com/b/YOUR_PRODUCT_ID"
  className="btn-subscribe"
>
  Subscribe Now
</a>
```

The user's email should match their FitMaker account email!

## ✨ Key Features

### Automatic Subscription Management
- ✅ Activates subscription on payment
- ✅ Tracks billing periods
- ✅ Handles cancellations
- ✅ Processes refunds
- ✅ Maintains payment history

### Security
- ✅ Protected API endpoints
- ✅ JWT authentication
- ✅ Role-based access (admin routes)
- ✅ Validated webhook data

### Database Structure
- ✅ User subscription embedded in User model
- ✅ Separate Subscription records for tracking
- ✅ Complete payment history in Payment model
- ✅ Optimized with database indexes

## 📝 Important Notes

1. **User Email Must Exist**
   - Users must register on FitMaker first
   - Payhip buyer email must match FitMaker account email
   
2. **Webhook Returns 200 Always**
   - Prevents Payhip from retrying on errors
   - Errors are logged but don't fail the webhook
   
3. **Plan Access Hierarchy**
   ```
   free < foundations < advanced < custom
   ```
   Higher tier users get all lower tier features.

4. **Subscription Cancellation**
   - Sets `cancelAtPeriodEnd = true`
   - User keeps access until period ends
   - Then status changes to 'cancelled'

## 🐛 Troubleshooting

### Webhook not received?
- Check Payhip dashboard webhook configuration
- Ensure your server URL is publicly accessible (use ngrok for testing)
- Check server logs: `console.log` will show webhook data

### Payment processed but user not upgraded?
- Check server logs for errors
- Verify user email exists in database
- Check MongoDB for subscription records
- Verify plan mapping is correct

### User can't access premium features?
- Check `user.subscription.status === 'active'`
- Verify `user.subscription.plan` is correct tier
- Check `user.subscription.endDate` is in future

## 📚 Next Steps

1. **Test with real Payhip account**
   - Use ngrok to expose localhost
   - Configure webhook in Payhip
   - Make test purchase
   
2. **Update frontend**
   - Add Payhip checkout buttons
   - Show subscription status
   - Display payment history
   
3. **Deploy to production**
   - Update webhook URL in Payhip
   - Set environment variables
   - Test end-to-end

## 🆘 Support

If you encounter issues:
1. Check backend console logs
2. Verify MongoDB data
3. Test webhook endpoint directly
4. Review PAYHIP_INTEGRATION.md for detailed docs

