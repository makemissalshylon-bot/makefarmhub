# MakeFarmHub Supabase Setup

## Prerequisites
- Supabase account
- Supabase CLI installed (`npm install -g supabase`)

## Setup Instructions

### 1. Link to Your Supabase Project
```bash
supabase link --project-ref your-project-ref
```

### 2. Run Migrations
```bash
# Run all migrations
supabase db push

# Or manually run each migration
psql -h db.your-project.supabase.co -U postgres -d postgres -f migrations/001_initial_schema.sql
psql -h db.your-project.supabase.co -U postgres -d postgres -f migrations/002_rpc_functions.sql
```

### 3. Seed Database (Optional)
```bash
psql -h db.your-project.supabase.co -U postgres -d postgres -f seed.sql
```

### 4. Environment Variables
Update your `.env` file:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Database Schema

### Tables
- **profiles** - User profiles with role-based access
- **listings** - Product listings from farmers
- **orders** - Order management with status tracking
- **wallets** - User wallet balances and escrow
- **wallet_transactions** - Transaction history
- **disputes** - Order dispute management
- **messages** - In-app messaging
- **reviews** - User ratings and reviews
- **vehicles** - Transporter vehicle fleet
- **transport_requests** - Transport booking requests
- **notifications** - User notifications

### Storage Buckets
- **avatars** - User profile pictures
- **listings** - Product images
- **vehicles** - Vehicle photos

## RPC Functions

### Admin Functions
- `get_admin_stats()` - Dashboard statistics
- `get_revenue_analytics(days)` - Revenue over time
- `get_top_products(limit)` - Best selling products
- `get_user_growth(days)` - User registration trends

### Wallet Functions
- `transfer_funds(from, to, amount, desc)` - Internal transfers
- `process_order_escrow(order_id, buyer_id, amount)` - Hold payment
- `release_order_escrow(order_id, buyer_id, seller_id, amount)` - Release payment

### Search Functions
- `search_listings(query, category, min_price, max_price, location, limit, offset)` - Advanced search

### Utility Functions
- `create_notification(user_id, type, title, message, link, metadata)` - Send notification
- `mark_all_notifications_read(user_id)` - Mark all as read
- `get_user_rating(user_id)` - Calculate average rating

## Row Level Security (RLS)

All tables have RLS enabled with appropriate policies:
- Users can only view/edit their own data
- Public data (profiles, listings, reviews) visible to all
- Admin role has elevated permissions
- Wallet operations restricted to owner

## Testing

```sql
-- Test admin stats
SELECT get_admin_stats();

-- Test search
SELECT * FROM search_listings('maize', 'crops', 0, 1000, NULL, 10, 0);

-- Test user rating
SELECT get_user_rating('user-uuid-here');
```
