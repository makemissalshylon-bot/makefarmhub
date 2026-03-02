export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string;
          role: 'farmer' | 'buyer' | 'transporter' | 'admin';
          avatar: string | null;
          location: string;
          verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email?: string;
          phone?: string;
          role?: 'farmer' | 'buyer' | 'transporter' | 'admin';
          avatar?: string | null;
          location?: string;
          verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string;
          role?: 'farmer' | 'buyer' | 'transporter' | 'admin';
          avatar?: string | null;
          location?: string;
          verified?: boolean;
          updated_at?: string;
        };
      };
      listings: {
        Row: {
          id: string;
          seller_id: string;
          title: string;
          description: string;
          category: 'crops' | 'livestock' | 'equipment';
          subcategory: string;
          price: number;
          unit: string;
          quantity: number;
          location: string;
          images: string[];
          status: 'active' | 'reserved' | 'sold' | 'draft';
          featured: boolean;
          views: number;
          organic: boolean;
          tags: string[];
          ready_to_sell: boolean;
          delivery_terms: string | null;
          delivery_options: string[];
          payment_options: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          seller_id: string;
          title: string;
          description?: string;
          category: 'crops' | 'livestock' | 'equipment';
          subcategory?: string;
          price: number;
          unit?: string;
          quantity?: number;
          location?: string;
          images?: string[];
          status?: 'active' | 'reserved' | 'sold' | 'draft';
          featured?: boolean;
          views?: number;
          organic?: boolean;
          tags?: string[];
          ready_to_sell?: boolean;
          delivery_terms?: string | null;
          delivery_options?: string[];
          payment_options?: string[];
        };
        Update: {
          title?: string;
          description?: string;
          category?: 'crops' | 'livestock' | 'equipment';
          subcategory?: string;
          price?: number;
          unit?: string;
          quantity?: number;
          location?: string;
          images?: string[];
          status?: 'active' | 'reserved' | 'sold' | 'draft';
          featured?: boolean;
          views?: number;
          organic?: boolean;
          tags?: string[];
          ready_to_sell?: boolean;
          delivery_terms?: string | null;
          delivery_options?: string[];
          payment_options?: string[];
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          listing_id: string;
          listing_title: string;
          listing_image: string;
          buyer_id: string;
          buyer_name: string;
          seller_id: string;
          seller_name: string;
          transporter_id: string | null;
          transporter_name: string | null;
          quantity: number;
          unit_price: number;
          total_price: number;
          escrow_amount: number;
          status: 'pending' | 'accepted' | 'in_transit' | 'delivered' | 'completed' | 'disputed' | 'cancelled';
          delivery_address: string;
          payment_method: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          listing_title: string;
          listing_image?: string;
          buyer_id: string;
          buyer_name: string;
          seller_id: string;
          seller_name: string;
          transporter_id?: string | null;
          transporter_name?: string | null;
          quantity: number;
          unit_price: number;
          total_price: number;
          escrow_amount?: number;
          status?: 'pending' | 'accepted' | 'in_transit' | 'delivered' | 'completed' | 'disputed' | 'cancelled';
          delivery_address?: string;
          payment_method?: string | null;
        };
        Update: {
          status?: 'pending' | 'accepted' | 'in_transit' | 'delivered' | 'completed' | 'disputed' | 'cancelled';
          transporter_id?: string | null;
          transporter_name?: string | null;
          payment_method?: string | null;
          delivery_address?: string;
          updated_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          participant_ids: string[];
          listing_id: string | null;
          listing_title: string | null;
          last_message: string;
          last_message_time: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          participant_ids: string[];
          listing_id?: string | null;
          listing_title?: string | null;
          last_message?: string;
          last_message_time?: string;
        };
        Update: {
          last_message?: string;
          last_message_time?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          sender_name: string;
          content: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          sender_name: string;
          content: string;
          read?: boolean;
        };
        Update: {
          read?: boolean;
        };
      };
      reviews: {
        Row: {
          id: string;
          order_id: string;
          reviewer_id: string;
          reviewer_name: string;
          reviewer_avatar: string | null;
          reviewer_role: 'farmer' | 'buyer' | 'transporter' | 'admin';
          target_id: string;
          target_name: string;
          target_type: 'seller' | 'buyer' | 'listing';
          rating: number;
          title: string;
          comment: string;
          images: string[];
          helpful: number;
          verified: boolean;
          seller_response: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          reviewer_id: string;
          reviewer_name: string;
          reviewer_avatar?: string | null;
          reviewer_role: 'farmer' | 'buyer' | 'transporter' | 'admin';
          target_id: string;
          target_name: string;
          target_type: 'seller' | 'buyer' | 'listing';
          rating: number;
          title?: string;
          comment: string;
          images?: string[];
          helpful?: number;
          verified?: boolean;
          seller_response?: Json | null;
        };
        Update: {
          helpful?: number;
          seller_response?: Json | null;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: 'order' | 'message' | 'payment' | 'system' | 'success' | 'warning' | 'info';
          read: boolean;
          action_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type: 'order' | 'message' | 'payment' | 'system' | 'success' | 'warning' | 'info';
          read?: boolean;
          action_url?: string | null;
        };
        Update: {
          read?: boolean;
        };
      };
      wallets: {
        Row: {
          user_id: string;
          balance: number;
          pending_balance: number;
          escrow_held: number;
          currency: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          balance?: number;
          pending_balance?: number;
          escrow_held?: number;
          currency?: string;
        };
        Update: {
          balance?: number;
          pending_balance?: number;
          escrow_held?: number;
          updated_at?: string;
        };
      };
      wallet_transactions: {
        Row: {
          id: string;
          user_id: string;
          type: 'deposit' | 'withdrawal' | 'escrow_hold' | 'escrow_release' | 'payment' | 'refund' | 'commission';
          amount: number;
          fee: number;
          status: 'pending' | 'completed' | 'failed';
          description: string;
          reference: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'deposit' | 'withdrawal' | 'escrow_hold' | 'escrow_release' | 'payment' | 'refund' | 'commission';
          amount: number;
          fee?: number;
          status?: 'pending' | 'completed' | 'failed';
          description?: string;
          reference?: string;
        };
        Update: {
          status?: 'pending' | 'completed' | 'failed';
        };
      };
      vehicles: {
        Row: {
          id: string;
          owner_id: string;
          owner_name: string;
          type: 'pickup' | 'truck' | 'lorry' | 'refrigerated';
          name: string;
          capacity: string;
          price_per_km: number;
          available: boolean;
          location: string;
          image: string;
          rating: number;
          trips: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          owner_name: string;
          type: 'pickup' | 'truck' | 'lorry' | 'refrigerated';
          name: string;
          capacity?: string;
          price_per_km?: number;
          available?: boolean;
          location?: string;
          image?: string;
          rating?: number;
          trips?: number;
        };
        Update: {
          name?: string;
          capacity?: string;
          price_per_km?: number;
          available?: boolean;
          location?: string;
          image?: string;
          rating?: number;
          trips?: number;
        };
      };
      transport_requests: {
        Row: {
          id: string;
          order_id: string;
          pickup_location: string;
          delivery_location: string;
          distance: number;
          estimated_price: number;
          status: 'pending' | 'accepted' | 'in_progress' | 'completed';
          vehicle_id: string | null;
          scheduled_date: string;
          current_location: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          pickup_location: string;
          delivery_location: string;
          distance?: number;
          estimated_price?: number;
          status?: 'pending' | 'accepted' | 'in_progress' | 'completed';
          vehicle_id?: string | null;
          scheduled_date?: string;
          current_location?: string | null;
        };
        Update: {
          status?: 'pending' | 'accepted' | 'in_progress' | 'completed';
          vehicle_id?: string | null;
          current_location?: string | null;
          updated_at?: string;
        };
      };
      disputes: {
        Row: {
          id: string;
          order_id: string;
          order_title: string;
          raised_by_id: string;
          raised_by_name: string;
          raised_by_role: string;
          against_id: string;
          against_name: string;
          against_role: string;
          reason: string;
          description: string;
          status: 'open' | 'investigating' | 'resolved' | 'escalated';
          amount: number;
          evidence: string[];
          resolution: string | null;
          created_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          order_id: string;
          order_title: string;
          raised_by_id: string;
          raised_by_name: string;
          raised_by_role: string;
          against_id: string;
          against_name: string;
          against_role: string;
          reason: string;
          description?: string;
          status?: 'open' | 'investigating' | 'resolved' | 'escalated';
          amount?: number;
          evidence?: string[];
          resolution?: string | null;
        };
        Update: {
          status?: 'open' | 'investigating' | 'resolved' | 'escalated';
          resolution?: string | null;
          resolved_at?: string | null;
        };
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
