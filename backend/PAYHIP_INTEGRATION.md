# Payhip Integration Documentation

## Overview
This document explains the complete Payhip subscription integration for FitMaker.

## Configuration

### 1. Environment Variables
Add to your `backend/.env` file:
```env
PAYHIP_API_KEY=abc
MONGODB_URI=mongodb://localhost:27017/fitmaker
FRONTEND_URL=http://localhost:3000
```

### 2. Payhip Dashboard Setup

#### Webhook Configuration
- **Webhook URL**: `http://localhost:5000/api/webhooks/payhip`
- **Production URL**: `https://yourdomain.com/api/webhooks/payhip`

#### Webhook Events (Enable All):
- ✅ `paid` - Customer is charged
- ✅ `subscription.created` - Subscription started
- ✅ `subscription.deleted` - Subscription cancelled
- ✅ `refunded` - Payment refunded

#### Products Setup
Create these products in your Payhip dashboard:

1. **Foundations**
   - Product ID: `foundations-monthly`
   - Price: $12/month
   - Recurring: Yes (Monthly)

2. **Advanced Accelerator**
   - Product ID: `advanced-monthly`
   - Price: $25/month
   - Recurring: Yes (Monthly)

3. **Custom Coaching**
   - Product ID: `custom-monthly`
   - Price: $50/month
   - Recurring: Yes (Monthly)

## Database Schema

### User Model Updates
```javascript
subscription: {
  plan: String,              // 'free', 'foundations', 'advanced', 'custom'
  status: String,            // 'active', 'inactive', 'cancelled', 'past_due', 'trialing'
  startDate: Date,
  endDate: Date,
  payhipCustomerId: String,
  payhipSubscriptionId: String,
  payhipProductId: String,
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  cancelAtPeriodEnd: Boolean
}
```

### Subscription Model
Tracks all subscription records with:
- User reference
- Plan details
- Billing information
- Payment history
- Payhip IDs

### Payment Model
Records every transaction:
- Transaction ID
- Amount and currency
- Status (completed, refunded, etc.)
- Webhook data for auditing

## API Endpoints

### Webhook Endpoint
- **POST** `/api/webhooks/payhip`
  - Handles Payhip webhook events
  - No authentication required
  - Returns 200 to prevent retries

### Subscription Management
- **GET** `/api/subscriptions/me` - Get current user's subscription
- **GET** `/api/subscriptions/payments` - Get payment history
- **POST** `/api/subscriptions/cancel` - Cancel subscription
- **POST** `/api/subscriptions/reactivate` - Reactivate cancelled subscription
- **GET** `/api/subscriptions/plans` - Get available plans

### Admin Endpoints
- **GET** `/api/subscriptions` - Get all subscriptions (Admin)
- **GET** `/api/subscriptions/stats` - Get subscription statistics (Admin)

## Webhook Event Flow

### 1. `paid` Event
When customer completes payment:
1. Receive webhook with transaction details
2. Find user by email
3. Determine plan from product ID or amount
4. Update user subscription status to 'active'
5. Create/update Subscription record
6. Create Payment record
7. Calculate next billing date

### 2. `subscription.created` Event
When subscription starts:
1. Find user by email
2. Update subscription IDs
3. Set status to 'active'

### 3. `subscription.deleted` Event
When customer cancels:
1. Find user by email
2. Set status to 'cancelled'
3. Mark `cancelAtPeriodEnd` as true
4. Keep access until period ends

### 4. `refunded` Event
When payment is refunded:
1. Find original payment record
2. Mark payment as 'refunded'
3. Downgrade user to 'free' plan
4. Cancel subscription

## Subscription Service

### Key Methods

#### `handlePaidEvent(webhookData)`
Processes payment and activates subscription.

#### `handleSubscriptionCreated(webhookData)`
Links subscription to user account.

#### `handleSubscriptionDeleted(webhookData)`
Cancels subscription at period end.

#### `handleRefunded(webhookData)`
Processes refund and downgrades account.

#### `getUserSubscription(userId)`
Gets user's active subscription details.

#### `getPaymentHistory(userId, limit)`
Retrieves user's payment history.

#### `hasAccess(userPlan, requiredPlan)`
Checks if user has access to features.

## Testing

### 1. Test Webhook Endpoint
```bash
curl http://localhost:5000/api/webhooks/test
```

### 2. Test Payment Event
```bash
curl -X POST http://localhost:5000/api/webhooks/payhip \
  -H "Content-Type: application/json" \
  -d '{
    "event": "paid",
    "buyer_email": "test@example.com",
    "buyer_name": "Test User",
    "product_id": "foundations-monthly",
    "transaction_id": "test-123",
    "amount": "12.00",
    "currency": "USD",
    "subscription_id": "sub-123"
  }'
```

### 3. Check User Subscription
```bash
curl http://localhost:5000/api/subscriptions/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Security Considerations

1. **Webhook Verification**
   - Webhooks are logged for audit
   - Returns 200 to prevent retries even on error
   - Validates required fields before processing

2. **User Authentication**
   - All subscription endpoints require JWT token
   - Admin endpoints check user role

3. **Data Validation**
   - Email validation
   - Amount validation
   - Plan validation against whitelist

## Monitoring

### Success Indicators
- ✅ User subscription status updated
- ✅ Subscription record created
- ✅ Payment record saved
- ✅ Console logs show success messages

### Error Handling
- All errors logged to console
- Webhook returns 200 to prevent retries
- User notified of payment status
- Failed payments tracked in database

## Common Issues

### Webhook Not Received
1. Check Payhip webhook URL is correct
2. Ensure server is publicly accessible (use ngrok for testing)
3. Verify firewall allows incoming connections
4. Check server logs for incoming requests

### Payment Not Processing
1. Verify webhook event type is supported
2. Check user email exists in database
3. Verify product ID matches plan mapping
4. Review console logs for error details

### User Can't Access Features
1. Check user subscription status is 'active'
2. Verify subscription end date is in future
3. Check plan matches required tier
4. Ensure subscription is not cancelled

## Plan Hierarchy

```
free < foundations < advanced < custom
```

Users with higher tier plans have access to all lower tier features.

## Support

For issues with:
- **Payhip payments**: Check Payhip dashboard
- **Database records**: Check MongoDB collections
- **Webhook processing**: Review server logs
- **User access**: Verify subscription status

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Payhip webhook URL updated to production
- [ ] Products created in Payhip dashboard
- [ ] Database indexes created
- [ ] Error monitoring setup
- [ ] Webhook events tested
- [ ] User flow tested end-to-end
- [ ] Admin dashboard shows correct data

