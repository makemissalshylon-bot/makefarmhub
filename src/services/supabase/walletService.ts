import { supabase } from '../../lib/supabase';

export const walletService = {
  async getWallet(userId: string) {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error) {
      // Wallet might not exist yet, create it
      if (error.code === 'PGRST116') {
        const { data: newWallet, error: createError } = await supabase
          .from('wallets')
          .insert({ user_id: userId } as any)
          .select()
          .single();
        if (createError) throw createError;
        return newWallet;
      }
      throw error;
    }
    return data;
  },

  async getTransactions(userId: string) {
    const { data, error } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async deposit(userId: string, amount: number, method: string) {
    // Create transaction record
    const { data: tx, error: txError } = await supabase
      .from('wallet_transactions')
      .insert({
        user_id: userId,
        type: 'deposit',
        amount,
        fee: 0,
        status: 'completed',
        description: `Deposit via ${method}`,
        reference: `DEP-${Date.now()}`,
      } as any)
      .select()
      .single();
    if (txError) throw txError;

    // Update wallet balance
    const wallet: any = await walletService.getWallet(userId);
    const { error: updateError } = await supabase
      .from('wallets')
      .update({
        balance: (wallet.balance || 0) + amount,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('user_id', userId);
    if (updateError) throw updateError;

    return tx;
  },

  async withdraw(userId: string, amount: number, method: string) {
    const wallet: any = await walletService.getWallet(userId);
    if ((wallet.balance || 0) < amount) {
      throw new Error('Insufficient balance');
    }

    const fee = amount * 0.02; // 2% withdrawal fee

    const { data: tx, error: txError } = await supabase
      .from('wallet_transactions')
      .insert({
        user_id: userId,
        type: 'withdrawal',
        amount,
        fee,
        status: 'completed',
        description: `Withdrawal to ${method}`,
        reference: `WDR-${Date.now()}`,
      } as any)
      .select()
      .single();
    if (txError) throw txError;

    const { error: updateError } = await supabase
      .from('wallets')
      .update({
        balance: (wallet.balance || 0) - amount - fee,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('user_id', userId);
    if (updateError) throw updateError;

    return tx;
  },

  async holdEscrow(userId: string, amount: number, orderId: string) {
    const wallet: any = await walletService.getWallet(userId);
    if ((wallet.balance || 0) < amount) {
      throw new Error('Insufficient balance for escrow');
    }

    const { error: txError } = await supabase
      .from('wallet_transactions')
      .insert({
        user_id: userId,
        type: 'escrow_hold',
        amount,
        status: 'completed',
        description: `Escrow hold for order ${orderId}`,
        reference: `ESC-${orderId}`,
      } as any);
    if (txError) throw txError;

    const { error: updateError } = await supabase
      .from('wallets')
      .update({
        balance: (wallet.balance || 0) - amount,
        escrow_held: (wallet.escrow_held || 0) + amount,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('user_id', userId);
    if (updateError) throw updateError;
  },

  async releaseEscrow(buyerUserId: string, sellerUserId: string, amount: number, orderId: string) {
    const commission = amount * 0.05; // 5% platform commission
    const sellerAmount = amount - commission;

    // Deduct from buyer's escrow
    const buyerWallet: any = await walletService.getWallet(buyerUserId);
    await supabase
      .from('wallets')
      .update({
        escrow_held: Math.max(0, (buyerWallet.escrow_held || 0) - amount),
        updated_at: new Date().toISOString(),
      } as any)
      .eq('user_id', buyerUserId);

    // Credit seller
    const sellerWallet: any = await walletService.getWallet(sellerUserId);
    await supabase
      .from('wallets')
      .update({
        balance: (sellerWallet.balance || 0) + sellerAmount,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('user_id', sellerUserId);

    // Record transactions
    await supabase.from('wallet_transactions').insert([
      {
        user_id: buyerUserId,
        type: 'escrow_release' as const,
        amount,
        status: 'completed' as const,
        description: `Escrow released for order ${orderId}`,
        reference: `REL-${orderId}`,
      },
      {
        user_id: sellerUserId,
        type: 'payment' as const,
        amount: sellerAmount,
        fee: commission,
        status: 'completed' as const,
        description: `Payment received for order ${orderId}`,
        reference: `PAY-${orderId}`,
      },
    ] as any);
  },
};
