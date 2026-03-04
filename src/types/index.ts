// User & Auth Types
export type UserRole = 'farmer' | 'buyer' | 'transporter' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  location: string;
  verified: boolean;
  createdAt: string;
}

// Listing Types
export type ListingCategory = 'crops' | 'livestock' | 'equipment';
export type ListingStatus = 'active' | 'reserved' | 'sold' | 'draft';

export interface Listing {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar?: string;
  sellerRating: number;
  sellerVerified: boolean;
  title: string;
  description: string;
  category: ListingCategory;
  subcategory: string;
  price: number;
  unit: string;
  quantity: number;
  location: string;
  images: string[];
  status: ListingStatus;
  featured: boolean;
  createdAt: string;
  views: number;
  organic?: boolean;
  tags?: string[];
  distance?: number;
  rating?: number;
  readyToSell?: boolean;
  deliveryTerms?: string;
  seller?: string;
}

// Order & Transaction Types
export type OrderStatus = 'pending' | 'accepted' | 'in_transit' | 'delivered' | 'completed' | 'disputed' | 'cancelled';

export interface Order {
  id: string;
  listingId: string;
  listingTitle: string;
  listingImage: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  transporterId?: string;
  transporterName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  escrowAmount: number;
  status: OrderStatus;
  createdAt: string;
  deliveryAddress: string;
  paymentMethod?: string;
}

// Chat Types
export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participants: { id: string; name: string; avatar?: string; role: UserRole }[];
  listingId?: string;
  listingTitle?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

// Transport Types
export type VehicleType = 'pickup' | 'truck' | 'lorry' | 'refrigerated';

export interface Vehicle {
  id: string;
  ownerId: string;
  ownerName: string;
  type: VehicleType;
  name: string;
  capacity: string;
  pricePerKm: number;
  available: boolean;
  location: string;
  image: string;
  rating: number;
  trips: number;
}

export interface TransportRequest {
  id: string;
  orderId: string;
  transporterId?: string;
  pickupLocation: string;
  deliveryLocation: string;
  distance: number;
  estimatedPrice: number;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed';
  vehicleId?: string;
  scheduledDate: string;
  currentLocation?: string;
  vehicle?: Vehicle;
}

// Notification Types
export interface Notification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: 'order' | 'message' | 'payment' | 'system' | 'success' | 'warning' | 'info';
  read: boolean;
  timestamp?: string;
  createdAt?: string;
  actionUrl?: string;
}

// Admin Types
export type DisputeStatus = 'open' | 'investigating' | 'resolved' | 'escalated';

export interface Dispute {
  id: string;
  orderId: string;
  orderTitle: string;
  raisedBy: { id: string; name: string; role: UserRole };
  against: { id: string; name: string; role: UserRole };
  reason: string;
  description: string;
  status: DisputeStatus;
  amount: number;
  evidence: string[];
  createdAt: string;
  resolvedAt?: string;
  resolution?: string;
}

export interface Transaction {
  id: string;
  orderId: string;
  orderTitle: string;
  type: 'escrow_in' | 'escrow_release' | 'commission' | 'refund' | 'payout';
  amount: number;
  commission: number;
  paymentMethod: string;
  fromUser: { id: string; name: string; role: UserRole };
  toUser: { id: string; name: string; role: UserRole };
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  totalFarmers: number;
  totalBuyers: number;
  totalTransporters: number;
  totalListings: number;
  activeListings: number;
  totalOrders: number;
  completedOrders: number;
  totalRevenue: number;
  totalCommission: number;
  pendingDisputes: number;
  escrowBalance: number;
}

// Wallet Types
export interface Wallet {
  userId: string;
  balance: number;
  pendingBalance: number;
  escrowHeld: number;
  currency: string;
  lastUpdated: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: 'deposit' | 'withdrawal' | 'escrow_hold' | 'escrow_release' | 'payment' | 'refund' | 'commission';
  amount: number;
  fee: number;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  reference: string;
  createdAt: string;
}

export interface PaymentMethod {
  id: string;
  userId: string;
  type: 'mobile_money' | 'bank_transfer' | 'card';
  provider: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
  verified: boolean;
}

export interface EscrowPayment {
  id: string;
  orderId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  platformFee: number;
  transportFee: number;
  totalAmount: number;
  status: 'pending' | 'held' | 'released' | 'refunded' | 'disputed';
  paymentMethod: string;
  paidAt?: string;
  releasedAt?: string;
  createdAt: string;
}

// Review & Rating Types
export interface Review {
  id: string;
  orderId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar?: string;
  reviewerRole: UserRole;
  targetId: string;
  targetName: string;
  targetType: 'seller' | 'buyer' | 'listing';
  rating: number;
  title: string;
  comment: string;
  images?: string[];
  photos?: string[];
  helpful: number;
  unhelpful?: number;
  verified: boolean;
  createdAt: string;
  sellerResponse?: {
    comment: string;
    respondedAt: string;
  };
}

export interface SellerStats {
  totalReviews: number;
  averageRating: number;
  ratings: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  responseRate: number;
  totalSales: number;
}