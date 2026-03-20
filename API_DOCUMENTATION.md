# MAKEFARMHUB API Documentation

## Base URL
```
Production: https://makefarmhub.vercel.app/api
Development: http://localhost:3000/api
```

## Authentication
Most endpoints require authentication via Supabase JWT token in Authorization header:
```
Authorization: Bearer <supabase_jwt_token>
```

---

## Payment APIs

### Create Payment Intent (Stripe)
**POST** `/create-payment-intent`

Create a Stripe payment intent for card payments.

**Request Body:**
```json
{
  "amount": 100.00,
  "currency": "USD",
  "userId": "user_id",
  "orderId": "order_id",
  "metadata": {}
}
```

**Response:**
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx"
}
```

---

### Stripe Webhook
**POST** `/stripe-webhook`

Receives Stripe payment events (payment_intent.succeeded, charge.refunded, etc.)

**Headers:**
```
stripe-signature: <webhook_signature>
```

---

### Mobile Money - Initiate Payment
**POST** `/mobile-money-initiate`

Initiate mobile money payment (EcoCash, OneMoney, InnBucks, Telecash)

**Request Body:**
```json
{
  "provider": "ecocash",
  "phoneNumber": "+263771234567",
  "amount": 50.00,
  "userId": "user_id",
  "orderId": "order_id"
}
```

**Response:**
```json
{
  "transactionRef": "MM-ECOCASH-123456789",
  "pollUrl": "/api/mobile-money-status",
  "message": "Payment initiated successfully"
}
```

---

### Mobile Money - Check Status
**POST** `/mobile-money-status`

Check payment status for mobile money transaction.

**Request Body:**
```json
{
  "transactionRef": "MM-ECOCASH-123456789",
  "provider": "ecocash"
}
```

**Response:**
```json
{
  "status": "success" | "pending" | "failed" | "timeout",
  "transactionRef": "MM-ECOCASH-123456789",
  "message": "Payment completed successfully",
  "timestamp": "2026-03-19T19:00:00.000Z"
}
```

---

### Mobile Money Webhook
**POST** `/mobile-money-webhook`

Receives payment confirmations from mobile money providers.

---

## Authentication & Security APIs

### Send Email Verification
**POST** `/send-verification-email`

Send email verification link to user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "userId": "user_id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification email sent"
}
```

---

### Send Phone OTP
**POST** `/send-phone-otp`

Send OTP code to phone number via SMS.

**Request Body:**
```json
{
  "phoneNumber": "+263771234567",
  "userId": "user_id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to +263771234567",
  "expiresIn": 600
}
```

---

### Reset Password
**POST** `/reset-password`

Send password reset email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

---

### Enable 2FA
**POST** `/enable-2fa`

Enable two-factor authentication for user.

**Request Body:**
```json
{
  "userId": "user_id"
}
```

**Response:**
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCodeUrl": "data:image/png;base64,...",
  "backupCodes": ["12345678", "87654321", ...]
}
```

---

### Verify 2FA
**POST** `/verify-2fa`

Verify TOTP code during login.

**Request Body:**
```json
{
  "userId": "user_id",
  "token": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "2FA verified successfully"
}
```

---

## Notification APIs

### Send SMS Notification
**POST** `/send-sms-notification`

Send SMS notification to user.

**Request Body:**
```json
{
  "phoneNumber": "+263771234567",
  "message": "Your order has been delivered!",
  "type": "order_update",
  "userId": "user_id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "SMS sent successfully"
}
```

---

## Supabase RPC Functions

### Get Admin Stats
```sql
SELECT * FROM get_admin_stats();
```

**Returns:**
```json
{
  "total_users": 150,
  "total_farmers": 60,
  "total_buyers": 80,
  "total_transporters": 10,
  "total_listings": 250,
  "active_orders": 45,
  "total_revenue": 15000,
  "platform_commission": 750,
  "escrow_balance": 5000
}
```

---

### Get Revenue Analytics
```sql
SELECT * FROM get_revenue_analytics(30);
```

**Parameters:**
- `days_back` (integer): Number of days to analyze

**Returns:**
```json
[
  {
    "date": "2026-03-19",
    "revenue": 450.00,
    "commission": 22.50,
    "order_count": 12
  }
]
```

---

### Get Top Products
```sql
SELECT * FROM get_top_products(10);
```

**Parameters:**
- `limit_count` (integer): Number of products to return

**Returns:**
```json
[
  {
    "listing_id": "listing_id",
    "title": "Maize - 50kg bags",
    "total_orders": 45,
    "total_revenue": 2250.00,
    "category": "crops"
  }
]
```

---

### Search Listings
```sql
SELECT * FROM search_listings(
  'maize',
  'crops',
  NULL,
  0,
  1000,
  'Harare',
  20,
  0
);
```

**Parameters:**
- `search_query` (text): Search term
- `category_filter` (text): Category
- `subcategory_filter` (text): Subcategory
- `min_price` (numeric): Minimum price
- `max_price` (numeric): Maximum price
- `location_filter` (text): Location
- `limit_count` (integer): Results limit
- `offset_count` (integer): Pagination offset

---

### Transfer Funds
```sql
SELECT transfer_funds(
  'sender_user_id',
  'receiver_user_id',
  100.00,
  'Payment for order'
);
```

---

### Process Order Escrow
```sql
SELECT process_order_escrow(
  'order_id',
  'buyer_user_id',
  150.00
);
```

---

### Release Order Escrow
```sql
SELECT release_order_escrow(
  'order_id',
  'seller_user_id',
  'buyer_user_id',
  150.00,
  0.05
);
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Missing or invalid auth token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

---

## Rate Limits

- API requests: 100 requests per minute per IP
- SMS OTP: 5 requests per hour per phone number
- Email verification: 3 requests per hour per email
- Payment initiation: 10 requests per minute per user

---

## Webhook Security

### Stripe Webhooks
Verify webhook signature using Stripe library:
```javascript
const signature = req.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(
  req.body,
  signature,
  STRIPE_WEBHOOK_SECRET
);
```

### Mobile Money Webhooks
Each provider has specific signature verification requirements. Check provider documentation.

---

## Testing

### Test Credentials
- **Admin**: phone: "admin" or "000", password: "admin"
- **OTP Code**: "1234" (development mode)

### Test Cards (Stripe)
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires 3DS: `4000 0025 0000 3155`

---

## Support

For API issues or questions:
- Email: api@makefarmhub.com
- Documentation: https://docs.makefarmhub.com
- Status: https://status.makefarmhub.com
