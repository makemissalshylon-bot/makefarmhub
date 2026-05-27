import { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo, type ReactNode } from 'react';
import type { Order, Conversation, Message, Notification, Listing, TransportRequest, Vehicle } from '../types';
import type { Address } from '../components/Address/AddressBook';
import { supabase, isSupabaseReady } from '../lib/supabase';
import { listingService } from '../services/supabase/listingService';
import { orderService } from '../services/supabase/orderService';
import { messageService } from '../services/supabase/messageService';
import { walletService } from '../services/supabase/walletService';
import { notificationService } from '../services/supabase/notificationService';
import { transportService } from '../services/supabase/transportService';
import { reviewService } from '../services/supabase/reviewService';
import { useAuth } from './AuthContext';

interface WalletTransaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'payment' | 'refund' | 'escrow';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

interface Review {
  id: string;
  targetId: string;
  targetType: 'seller' | 'listing';
  rating: number;
  title: string;
  comment: string;
  authorName: string;
  date: string;
}

interface SellerStats {
  totalSales: number;
  commissionPaid: boolean;
  lastCommissionDate?: string;
}

interface AppDataContextType {
  // Orders
  orders: Order[];
  createOrder: (order: Omit<Order, 'id' | 'createdAt'>) => string;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  
  // Seller Commission
  sellerStats: Record<string, SellerStats>;
  getSellerStats: (sellerId: string) => SellerStats;
  payCommission: (sellerId: string, amount: number) => void;
  canSellerList: (sellerId: string) => boolean;
  
  // Messages
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  sendMessage: (conversationId: string, content: string) => void;
  
  // Notifications
  notifications: Notification[];
  createNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  
  // Wallet
  walletBalance: number;
  escrowBalance: number;
  walletTransactions: WalletTransaction[];
  addFunds: (amount: number, method: string) => void;
  withdrawFunds: (amount: number, method: string) => void;
  releaseEscrow: (orderId: string) => void;
  raiseDispute: (orderId: string, reason: string) => void;
  
  // Listings
  listings: Listing[];
  addListing: (listing: Omit<Listing, 'id'>) => void;
  deleteListing: (id: string) => void;
  updateListingStatus: (id: string, status: string) => void;
  moderateListing: (id: string, action: 'approve' | 'reject' | 'flag', reason?: string) => void;
  
  // Transport
  transportRequests: TransportRequest[];
  vehicles: Vehicle[];
  bookTransport: (request: Omit<TransportRequest, 'id'>) => void;
  updateTransportStatus: (id: string, status: TransportRequest['status']) => void;
  
  // Reviews
  reviews: Review[];
  addReview: (review: Omit<Review, 'id' | 'date'>) => void;
  
  // Favorites
  favorites: string[];
  toggleFavorite: (listingId: string) => void;
  isFavorite: (listingId: string) => boolean;
  
  // Addresses
  addresses: Address[];
  addAddress: (address: Omit<Address, 'id'>) => void;
  updateAddress: (id: string, address: Partial<Address>) => void;
  deleteAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  // Cache isSupabaseReady in a ref so we don't call the function inside dependency arrays.
  // The value is set once during the initial data load and never changes after that.
  const supabaseReady = useRef(isSupabaseReady());
  useEffect(() => { supabaseReady.current = isSupabaseReady(); }, [user]);

  // Start with empty state; Supabase data loads once user is authenticated
  const [orders, setOrders] = useState<Order[]>([]);
  
  // Messages state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  
  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Wallet state
  const [walletBalance, setWalletBalance] = useState(0);
  const [escrowBalance, setEscrowBalance] = useState(0);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  
  // Listings state
  const [listings, setListings] = useState<Listing[]>([]);
  
  // Transport state
  const [transportRequests, setTransportRequests] = useState<TransportRequest[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  
  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  
  // Favorites state (persisted to localStorage)
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('makefarmhub_favorites');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Addresses state (persisted to localStorage)
  const [addresses, setAddresses] = useState<Address[]>(() => {
    const saved = localStorage.getItem('makefarmhub_addresses');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Seller stats state (persisted to localStorage)
  const [sellerStats, setSellerStats] = useState<Record<string, SellerStats>>(() => {
    const saved = localStorage.getItem('makefarmhub_seller_stats');
    return saved ? JSON.parse(saved) : {};
  });

  // Keep refs to frequently-read state so callbacks can read current values
  // without adding them to dependency arrays (which causes cascading re-renders).
  const ordersRef = useRef(orders);
  ordersRef.current = orders;
  const favoritesRef = useRef(favorites);
  favoritesRef.current = favorites;
  const walletBalanceRef = useRef(walletBalance);
  walletBalanceRef.current = walletBalance;
  const sellerStatsRef = useRef(sellerStats);
  sellerStatsRef.current = sellerStats;

  // ============================================
  // SUPABASE DATA LOADING
  // ============================================
  useEffect(() => {
    if (!isSupabaseReady() || !user) return;

    const loadData = async () => {
      // Load each data source independently so one failure doesn't crash the app
      
      // Load listings
      try {
        const dbListings = await listingService.getAll();
        const mappedListings: Listing[] = dbListings.map((l: any) => ({
          id: l.id,
          sellerId: l.seller_id,
          sellerName: l.profiles?.name || 'Unknown Seller',
          sellerAvatar: l.profiles?.avatar || '',
          sellerRating: Number(l.profiles?.rating || 0),
          sellerVerified: l.profiles?.verified || false,
          sellerLocation: l.profiles?.location || l.location || '',
          title: l.title,
          description: l.description,
          category: l.category,
          subcategory: l.subcategory,
          price: Number(l.price),
          unit: l.unit,
          quantity: l.quantity,
          location: l.location,
          images: l.images || [],
          status: l.status,
          featured: l.featured,
          views: l.views,
          organic: l.organic,
          tags: l.tags || [],
          readyToSell: l.ready_to_sell,
          deliveryTerms: l.delivery_terms,
          deliveryOptions: l.delivery_options || [],
          paymentOptions: l.payment_options || [],
          createdAt: l.created_at,
        }));
        setListings(mappedListings);
      } catch (err) {
        if (import.meta.env.DEV) console.warn('Failed to load listings from Supabase:', err);
      }

      // Load orders
      try {
        const role = user.role === 'farmer' ? 'seller' : user.role === 'transporter' ? 'transporter' : 'buyer';
        const dbOrders = await orderService.getAll(user.id, role as any);
        const mappedOrders: Order[] = dbOrders.map((o: any) => ({
          id: o.id,
          listingId: o.listing_id,
          listingTitle: o.listing_title,
          listingImage: o.listing_image,
          buyerId: o.buyer_id,
          buyerName: o.buyer_name,
          sellerId: o.seller_id,
          sellerName: o.seller_name,
          transporterId: o.transporter_id,
          transporterName: o.transporter_name,
          quantity: o.quantity,
          unitPrice: Number(o.unit_price),
          totalPrice: Number(o.total_price),
          escrowAmount: Number(o.escrow_amount),
          status: o.status,
          deliveryAddress: o.delivery_address,
          paymentMethod: o.payment_method,
          createdAt: o.created_at,
        }));
        setOrders(mappedOrders);
      } catch (err) {
        if (import.meta.env.DEV) console.warn('Failed to load orders from Supabase:', err);
      }

      // Load conversations
      try {
        const dbConvos = await messageService.getConversations(user.id);
        const mappedConvos: Conversation[] = dbConvos.map((c: any) => ({
          id: c.id,
          participants: (c.participant_ids || []).map((pid: string, idx: number) => ({
            id: pid,
            name: c.participant_names?.[idx] || 'User',
            avatar: c.participant_avatars?.[idx] || '',
            role: 'buyer' as const,
          })),
          listingId: c.listing_id,
          listingTitle: c.listing_title,
          lastMessage: c.last_message,
          lastMessageTime: new Date(c.last_message_time).toLocaleString(),
          unreadCount: 0,
        }));
        setConversations(mappedConvos);
      } catch (err) {
        if (import.meta.env.DEV) console.warn('Failed to load conversations from Supabase:', err);
      }

      // Load notifications
      try {
        const dbNotifs = await notificationService.getAll(user.id);
        const mappedNotifs: Notification[] = dbNotifs.map((n: any) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          read: n.read,
          timestamp: new Date(n.created_at).toLocaleString(),
          actionUrl: n.action_url,
        }));
        setNotifications(mappedNotifs);
      } catch (err) {
        if (import.meta.env.DEV) console.warn('Failed to load notifications from Supabase:', err);
      }

      // Load wallet
      try {
        const wallet: any = await walletService.getWallet(user.id);
        setWalletBalance(Number(wallet?.balance) || 0);
        setEscrowBalance(Number(wallet?.escrow_held) || 0);
        const txns = await walletService.getTransactions(user.id);
        setWalletTransactions(txns.map((t: any) => ({
          id: t.id,
          type: t.type === 'escrow_hold' || t.type === 'escrow_release' ? 'escrow' : t.type,
          amount: Number(t.amount),
          description: t.description,
          date: t.created_at?.split('T')[0] || '',
          status: t.status,
        })));
      } catch { /* wallet may not exist yet */ }

      // Load vehicles & transport
      try {
        const dbVehicles = await transportService.getVehicles();
        setVehicles(dbVehicles.map((v: any) => ({
          id: v.id,
          ownerId: v.owner_id,
          ownerName: v.owner_name,
          type: v.type,
          name: v.name,
          capacity: v.capacity,
          pricePerKm: Number(v.price_per_km),
          available: v.available,
          location: v.location,
          image: v.image,
          rating: Number(v.rating),
          trips: v.trips,
        })));
      } catch (err) {
        if (import.meta.env.DEV) console.warn('Failed to load vehicles from Supabase:', err);
      }

      try {
        const dbTransport = await transportService.getTransportRequests();
        setTransportRequests(dbTransport.map((t: any) => ({
          id: t.id,
          orderId: t.order_id,
          pickupLocation: t.pickup_location,
          deliveryLocation: t.delivery_location,
          distance: Number(t.distance),
          estimatedPrice: Number(t.estimated_price),
          status: t.status,
          vehicleId: t.vehicle_id,
          scheduledDate: t.scheduled_date,
          currentLocation: t.current_location,
        })));
      } catch (err) {
        if (import.meta.env.DEV) console.warn('Failed to load transport requests from Supabase:', err);
      }
    };

    loadData();
  }, [user]);

  // ============================================
  // REALTIME SUBSCRIPTIONS
  // ============================================
  useEffect(() => {
    if (!isSupabaseReady() || !user) return;

    // Subscribe to new messages
    const msgChannel = supabase
      .channel('realtime-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const m = payload.new as any;
        setMessages(prev => ({
          ...prev,
          [m.conversation_id]: [...(prev[m.conversation_id] || []), {
            id: m.id,
            senderId: m.sender_id,
            senderName: m.sender_name,
            content: m.content,
            timestamp: m.created_at,
            read: m.read,
          }],
        }));
      })
      .subscribe();

    // Subscribe to new notifications
    const notifChannel = supabase
      .channel('realtime-notifications')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const n = payload.new as any;
        setNotifications(prev => [{
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          read: false,
          timestamp: 'Just now',
          actionUrl: n.action_url,
        }, ...prev]);
      })
      .subscribe();

    // Subscribe to order updates
    const orderChannel = supabase
      .channel('realtime-orders')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        const o = payload.new as any;
        setOrders(prev => prev.map(order =>
          order.id === o.id ? { ...order, status: o.status } : order
        ));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(notifChannel);
      supabase.removeChannel(orderChannel);
    };
  }, [user]);

  // ============================================
  // ORDER FUNCTIONS
  // ============================================
  const createOrder = useCallback((order: Omit<Order, 'id' | 'createdAt'>) => {
    const newOrderId = `order-${Date.now()}`;
    const newOrder: Order = {
      ...order,
      id: newOrderId,
      createdAt: new Date().toISOString(),
    } as Order;
    setOrders(prev => [newOrder, ...prev]);
    
    if (supabaseReady.current) {
      orderService.create({
        listing_id: order.listingId,
        listing_title: order.listingTitle,
        listing_image: order.listingImage || '',
        buyer_id: order.buyerId,
        buyer_name: order.buyerName,
        seller_id: order.sellerId,
        seller_name: order.sellerName,
        quantity: order.quantity,
        unit_price: order.unitPrice,
        total_price: order.totalPrice,
        escrow_amount: order.escrowAmount || 0,
        delivery_address: order.deliveryAddress || '',
        payment_method: order.paymentMethod,
      }).then((dbOrder: any) => {
        // Replace temp ID with real DB ID
        setOrders(prev => prev.map(o => o.id === newOrderId ? { ...o, id: dbOrder.id } : o));
      }).catch(err => {
        if (import.meta.env.DEV) console.error('Error creating order:', err);
      });
    }
    
    // Update seller stats when order is completed
    if (newOrder.status === 'completed' && newOrder.sellerId) {
      setSellerStats(prev => {
        const current = prev[newOrder.sellerId] || { totalSales: 0, commissionPaid: false };
        const updated = {
          ...current,
          totalSales: current.totalSales + (newOrder.totalPrice || 0),
        };
        const newStats = { ...prev, [newOrder.sellerId]: updated };
        localStorage.setItem('makefarmhub_seller_stats', JSON.stringify(newStats));
        return newStats;
      });
    }
    
    return newOrderId;
  }, []);

  const updateOrderStatus = useCallback((orderId: string, status: Order['status']) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status } : order
    ));
    if (supabaseReady.current) {
      orderService.updateStatus(orderId, status).catch(err => {
        if (import.meta.env.DEV) console.error('Error updating order:', err);
      });
    }
  }, []);

  // ============================================
  // MESSAGE FUNCTIONS
  // ============================================
  const sendMessage = useCallback((conversationId: string, content: string) => {
    const senderId = user?.id || 'current-user';
    const senderName = user?.name || 'You';

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId,
      senderName,
      content,
      timestamp: new Date().toISOString(),
      read: true,
    };
    
    setMessages(prev => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), newMessage],
    }));
    
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId 
        ? { ...conv, lastMessage: content, lastMessageTime: 'Just now', unreadCount: 0 }
        : conv
    ));

    if (supabaseReady.current) {
      messageService.sendMessage({
        conversation_id: conversationId,
        sender_id: senderId,
        sender_name: senderName,
        content,
      }).catch(err => {
        if (import.meta.env.DEV) console.error('Error sending message:', err);
      });
    }
  }, [user]);

  // ============================================
  // NOTIFICATION FUNCTIONS
  // ============================================
  const createNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}`,
      timestamp: 'Just now',
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev]);

    if (supabaseReady.current && user) {
      notificationService.create({
        user_id: user.id,
        title: notification.title,
        message: notification.message,
        type: notification.type as any,
        action_url: notification.actionUrl,
      }).catch(err => {
        if (import.meta.env.DEV) console.error('Error creating notification:', err);
      });
    }
  }, [user]);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
    if (supabaseReady.current) {
      notificationService.markAsRead(id).catch(err => {
        if (import.meta.env.DEV) console.error('Error marking notification read:', err);
      });
    }
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    if (supabaseReady.current && user) {
      notificationService.markAllAsRead(user.id).catch(err => {
        if (import.meta.env.DEV) console.error('Error marking all read:', err);
      });
    }
  }, [user]);

  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (supabaseReady.current) {
      notificationService.delete(id).catch(err => {
        if (import.meta.env.DEV) console.error('Error deleting notification:', err);
      });
    }
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    if (supabaseReady.current && user) {
      notificationService.deleteAll(user.id).catch(err => {
        if (import.meta.env.DEV) console.error('Error clearing notifications:', err);
      });
    }
  }, [user]);

  // ============================================
  // WALLET FUNCTIONS
  // ============================================
  const addFunds = useCallback((amount: number, method: string) => {
    if (amount <= 0) return;
    const txnId = `txn-${Date.now()}`;
    setWalletBalance(prev => prev + amount);
    setWalletTransactions(prev => [{
      id: txnId,
      type: 'deposit',
      amount,
      description: `${method} Deposit`,
      date: new Date().toISOString().split('T')[0],
      status: 'completed',
    }, ...prev]);

    if (supabaseReady.current && user) {
      walletService.deposit(user.id, amount, method).catch(err => {
        if (import.meta.env.DEV) console.error('Error depositing:', err);
        // Rollback optimistic update on failure
        setWalletBalance(prev => prev - amount);
        setWalletTransactions(prev => prev.map(t =>
          t.id === txnId ? { ...t, status: 'failed' as const } : t
        ));
      });
    }
  }, [user]);

  const withdrawFunds = useCallback((amount: number, method: string) => {
    if (amount <= 0 || amount > walletBalanceRef.current) return;
    const txnId = `txn-${Date.now()}`;
    setWalletBalance(prev => prev - amount);
    setWalletTransactions(prev => [{
      id: txnId,
      type: 'withdrawal',
      amount: -amount,
      description: `Withdrawal to ${method}`,
      date: new Date().toISOString().split('T')[0],
      status: 'completed',
    }, ...prev]);

    if (supabaseReady.current && user) {
      walletService.withdraw(user.id, amount, method).catch(err => {
        if (import.meta.env.DEV) console.error('Error withdrawing:', err);
        // Rollback optimistic update on failure
        setWalletBalance(prev => prev + amount);
        setWalletTransactions(prev => prev.map(t =>
          t.id === txnId ? { ...t, status: 'failed' as const } : t
        ));
      });
    }
  }, [user]);

  // Track in-flight escrow releases to prevent double-click / duplicate processing
  const releasingRef = useRef<Set<string>>(new Set());

  const releaseEscrow = useCallback((orderId: string) => {
    // Only allow release from 'delivered' status; skip if already in-flight
    const order = ordersRef.current.find(o => o.id === orderId);
    if (!order || order.status !== 'delivered') return;
    if (releasingRef.current.has(orderId)) return;
    releasingRef.current.add(orderId);

    setOrders(prev => prev.map(o => 
      o.id === orderId ? { ...o, status: 'completed' } : o
    ));
    
    if (supabaseReady.current) {
      walletService.releaseEscrow(order.buyerId, order.sellerId, order.escrowAmount || order.totalPrice, orderId)
        .catch(err => {
          if (import.meta.env.DEV) console.error('Error releasing escrow:', err);
          // Rollback status on failure
          setOrders(prev => prev.map(o =>
            o.id === orderId ? { ...o, status: 'delivered' } : o
          ));
        })
        .finally(() => { releasingRef.current.delete(orderId); });
      orderService.updateStatus(orderId, 'completed')
        .catch(err => {
          if (import.meta.env.DEV) console.error('Error updating order:', err);
        });
    } else {
      releasingRef.current.delete(orderId);
    }

    createNotification({
      type: 'success',
      title: 'Payment Released',
      message: `Escrow payment for order #${orderId} has been released to the seller`,
      actionUrl: `/orders/${orderId}`,
    });
  }, [createNotification]);

  const raiseDispute = useCallback((orderId: string, _reason: string) => {
    // Only allow dispute from 'delivered' or 'in_transit' status
    const order = ordersRef.current.find(o => o.id === orderId);
    if (!order || (order.status !== 'delivered' && order.status !== 'in_transit')) return;

    const prevStatus = order.status;
    setOrders(prev => prev.map(o => 
      o.id === orderId ? { ...o, status: 'disputed' } : o
    ));
    
    if (supabaseReady.current) {
      orderService.updateStatus(orderId, 'disputed')
        .catch(err => {
          if (import.meta.env.DEV) console.error('Error updating order:', err);
          // Rollback on failure
          setOrders(prev => prev.map(o =>
            o.id === orderId ? { ...o, status: prevStatus } : o
          ));
        });
    }

    createNotification({
      type: 'warning',
      title: 'Dispute Raised',
      message: `A dispute has been raised for order #${orderId}. Our team will review it.`,
      actionUrl: `/orders/${orderId}`,
    });
  }, [createNotification]);

  // ============================================
  // LISTING FUNCTIONS
  // ============================================
  const addListing = useCallback((listing: Omit<Listing, 'id'>) => {
    const tempId = `listing-${Date.now()}`;
    const newListing: Listing = {
      ...listing,
      id: tempId,
    } as Listing;
    setListings(prev => [newListing, ...prev]);

    if (supabaseReady.current && user) {
      listingService.create({
        seller_id: user.id,
        title: listing.title,
        description: listing.description,
        category: listing.category as any,
        subcategory: listing.subcategory,
        price: listing.price,
        unit: listing.unit,
        quantity: listing.quantity,
        location: listing.location,
        images: listing.images,
        ready_to_sell: listing.readyToSell,
        delivery_terms: listing.deliveryTerms,
        delivery_options: (listing as any).deliveryOptions,
        payment_options: (listing as any).paymentOptions,
        organic: listing.organic,
        tags: listing.tags,
      }).then((dbListing: any) => {
        setListings(prev => prev.map(l => l.id === tempId ? { ...l, id: dbListing.id } : l));
      }).catch(err => {
        if (import.meta.env.DEV) console.error('Error creating listing:', err);
      });
    }
  }, [user]);

  const deleteListing = useCallback((id: string) => {
    setListings(prev => prev.filter(l => l.id !== id));
    if (supabaseReady.current) {
      listingService.delete(id).catch(err => console.error('Error deleting listing:', err));
    }
  }, []);

  const updateListingStatus = useCallback((id: string, status: string) => {
    setListings(prev => prev.map(listing => 
      listing.id === id ? { ...listing, status: status as Listing['status'] } : listing
    ));
    if (supabaseReady.current) {
      listingService.update(id, { status }).catch(err => console.error('Error updating listing:', err));
    }
  }, []);

  const moderateListing = useCallback((id: string, action: 'approve' | 'reject' | 'flag', reason?: string) => {
    setListings(prev => prev.map(listing => {
      if (listing.id === id) {
        const updated = { ...listing } as any;
        if (action === 'approve') {
          updated.moderationStatus = 'approved';
          updated.status = 'active';
          delete updated.flaggedReason;
        } else if (action === 'reject') {
          updated.moderationStatus = 'rejected';
          updated.status = 'inactive';
        } else if (action === 'flag') {
          updated.moderationStatus = 'flagged';
          updated.flaggedReason = reason || 'Flagged for review';
        }
        return updated;
      }
      return listing;
    }));
    if (supabaseReady.current) {
      const statusMap = { approve: 'active', reject: 'draft', flag: 'active' };
      listingService.update(id, { status: statusMap[action] }).catch(err => console.error('Error moderating listing:', err));
    }
  }, []);

  // ============================================
  // TRANSPORT FUNCTIONS
  // ============================================
  const bookTransport = useCallback((request: Omit<TransportRequest, 'id'>) => {
    const tempId = `req-${Date.now()}`;
    const newRequest: TransportRequest = {
      ...request,
      id: tempId,
    } as TransportRequest;
    setTransportRequests(prev => [newRequest, ...prev]);

    if (supabaseReady.current) {
      transportService.createTransportRequest({
        order_id: request.orderId,
        pickup_location: request.pickupLocation,
        delivery_location: request.deliveryLocation,
        distance: request.distance,
        estimated_price: request.estimatedPrice,
        vehicle_id: request.vehicleId,
        scheduled_date: request.scheduledDate,
      }).then((dbReq: any) => {
        setTransportRequests(prev => prev.map(r => r.id === tempId ? { ...r, id: dbReq.id } : r));
      }).catch(err => console.error('Error booking transport:', err));
    }
  }, []);

  const updateTransportStatus = useCallback((id: string, status: TransportRequest['status']) => {
    setTransportRequests(prev => prev.map(req => 
      req.id === id ? { ...req, status } : req
    ));
    if (supabaseReady.current) {
      transportService.updateTransportRequest(id, { status }).catch(err => console.error('Error updating transport:', err));
    }
  }, []);

  // ============================================
  // REVIEW FUNCTIONS
  // ============================================
  const addReview = useCallback((review: Omit<Review, 'id' | 'date'>) => {
    const newReview: Review = {
      ...review,
      id: `review-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
    };
    setReviews(prev => [newReview, ...prev]);

    if (supabaseReady.current && user) {
      reviewService.create({
        order_id: (review as any).orderId || '',
        reviewer_id: user.id,
        reviewer_name: user.name,
        reviewer_avatar: user.avatar,
        reviewer_role: user.role,
        target_id: review.targetId,
        target_name: review.authorName,
        target_type: review.targetType as any,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
      }).catch(err => console.error('Error creating review:', err));
    }
  }, [user]);
  
  // ============================================
  // FAVORITES FUNCTIONS
  // ============================================
  const toggleFavorite = useCallback((listingId: string) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(listingId)
        ? prev.filter(id => id !== listingId)
        : [...prev, listingId];
      localStorage.setItem('makefarmhub_favorites', JSON.stringify(newFavorites));
      return newFavorites;
    });
  }, []);
  
  const isFavorite = useCallback((listingId: string) => {
    return favoritesRef.current.includes(listingId);
  }, []);

  // ============================================
  // ADDRESS FUNCTIONS
  // ============================================
  const addAddress = useCallback((address: Omit<Address, 'id'>) => {
    const newAddress: Address = {
      ...address,
      id: `addr-${Date.now()}`,
    };
    setAddresses(prev => {
      const updated = [...prev, newAddress];
      localStorage.setItem('makefarmhub_addresses', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateAddress = useCallback((id: string, address: Partial<Address>) => {
    setAddresses(prev => {
      const updated = prev.map(addr => addr.id === id ? { ...addr, ...address } : addr);
      localStorage.setItem('makefarmhub_addresses', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteAddress = useCallback((id: string) => {
    setAddresses(prev => {
      const updated = prev.filter(addr => addr.id !== id);
      localStorage.setItem('makefarmhub_addresses', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const setDefaultAddress = useCallback((id: string) => {
    setAddresses(prev => {
      const updated = prev.map(addr => ({ ...addr, isDefault: addr.id === id }));
      localStorage.setItem('makefarmhub_addresses', JSON.stringify(updated));
      return updated;
    });
  }, []);
  
  // ============================================
  // SELLER COMMISSION FUNCTIONS
  // ============================================
  const getSellerStats = useCallback((sellerId: string): SellerStats => {
    return sellerStatsRef.current[sellerId] || { totalSales: 0, commissionPaid: false };
  }, []);
  
  const payCommission = useCallback((sellerId: string, amount: number) => {
    setSellerStats(prev => {
      const updated = {
        ...prev,
        [sellerId]: {
          totalSales: prev[sellerId]?.totalSales || 0,
          commissionPaid: true,
          lastCommissionDate: new Date().toISOString(),
        },
      };
      localStorage.setItem('makefarmhub_seller_stats', JSON.stringify(updated));
      return updated;
    });
    
    setWalletBalance(prev => prev - amount);
    setWalletTransactions(prev => [{
      id: `txn-${Date.now()}`,
      type: 'payment',
      amount: -amount,
      description: 'Service Contribution - Platform Fee',
      date: new Date().toISOString().split('T')[0],
      status: 'completed',
    }, ...prev]);
    
    createNotification({
      type: 'success',
      title: 'Service Contribution Paid',
      message: `You can now continue listing and selling products. Thank you for supporting MakeFarmHub!`,
    });
  }, [createNotification]);
  
  const canSellerList = useCallback((sellerId: string): boolean => {
    const stats = sellerStatsRef.current[sellerId];
    if (!stats) return true;
    if (stats.totalSales < 100) return true;
    return stats.commissionPaid;
  }, []);

  const contextValue = useMemo<AppDataContextType>(() => ({
    orders,
    createOrder,
    updateOrderStatus,
    conversations,
    messages,
    sendMessage,
    notifications,
    createNotification,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    clearAllNotifications,
    walletBalance,
    escrowBalance,
    walletTransactions,
    addFunds,
    withdrawFunds,
    releaseEscrow,
    raiseDispute,
    listings,
    addListing,
    deleteListing,
    updateListingStatus,
    moderateListing,
    transportRequests,
    vehicles,
    bookTransport,
    updateTransportStatus,
    reviews,
    addReview,
    favorites,
    toggleFavorite,
    isFavorite,
    addresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    sellerStats,
    getSellerStats,
    payCommission,
    canSellerList,
  }), [
    orders, createOrder, updateOrderStatus,
    conversations, messages, sendMessage,
    notifications, createNotification, markNotificationRead,
    markAllNotificationsRead, deleteNotification, clearAllNotifications,
    walletBalance, escrowBalance, walletTransactions,
    addFunds, withdrawFunds, releaseEscrow, raiseDispute,
    listings, addListing, deleteListing, updateListingStatus, moderateListing,
    transportRequests, vehicles, bookTransport, updateTransportStatus,
    reviews, addReview,
    favorites, toggleFavorite, isFavorite,
    addresses, addAddress, updateAddress, deleteAddress, setDefaultAddress,
    sellerStats, getSellerStats, payCommission, canSellerList,
  ]);

  return (
    <AppDataContext.Provider value={contextValue}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
}
