import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Truck,
  ChevronDown,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { isSupabaseReady } from '../../lib/supabase';
import { adminService } from '../../services/supabase/adminService';

export default function AdminTransactions() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (isSupabaseReady()) {
      adminService.getAllTransactions().then(data => {
        if (data.length > 0) {
          setTransactions(data.map((t: any) => ({
            id: t.id,
            type: t.type === 'escrow_hold' ? 'escrow_in' : t.type === 'escrow_release' ? 'escrow_release' : t.type === 'payment' ? 'commission' : t.type,
            amount: Number(t.amount),
            commission: Number(t.fee || 0),
            status: t.status,
            paymentMethod: 'Wallet',
            orderTitle: t.description || t.reference || 'Transaction',
            fromUser: { name: 'User', role: 'buyer' },
            toUser: { name: 'Seller', role: 'farmer' },
            createdAt: t.created_at,
          })));
        }
      }).catch(() => {});
    }
  }, []);

  const filteredTransactions = transactions.filter((txn) => {
    const matchesSearch =
      txn.orderTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.fromUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.toUser.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || txn.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || txn.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalAmount = filteredTransactions.reduce((sum, txn) => sum + txn.amount, 0);
  const totalCommission = filteredTransactions.reduce((sum, txn) => sum + txn.commission, 0);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'escrow_in':
        return <ArrowDownRight size={18} />;
      case 'escrow_release':
        return <ArrowUpRight size={18} />;
      case 'commission':
        return <DollarSign size={18} />;
      case 'payout':
        return <Truck size={18} />;
      case 'refund':
        return <ArrowDownRight size={18} />;
      default:
        return <DollarSign size={18} />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={14} />;
      case 'pending':
        return <Clock size={14} />;
      case 'failed':
        return <XCircle size={14} />;
      default:
        return null;
    }
  };

  const formatType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Transactions</h1>
          <p>Monitor all financial transactions on the platform</p>
        </div>
        <button className="btn-secondary">
          <Download size={18} /> Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <span className="summary-label">Total Volume</span>
          <span className="summary-value">${totalAmount.toLocaleString()}</span>
        </div>
        <div className="summary-card green">
          <span className="summary-label">Commission Earned</span>
          <span className="summary-value">${totalCommission.toLocaleString()}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Transactions</span>
          <span className="summary-value">{filteredTransactions.length}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Type</label>
          <div className="select-wrapper">
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">All Types</option>
              <option value="escrow_in">Escrow In</option>
              <option value="escrow_release">Escrow Release</option>
              <option value="commission">Commission</option>
              <option value="payout">Payout</option>
              <option value="refund">Refund</option>
            </select>
            <ChevronDown size={16} />
          </div>
        </div>

        <div className="filter-group">
          <label>Status</label>
          <div className="select-wrapper">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <ChevronDown size={16} />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Type</th>
              <th>Order</th>
              <th>From</th>
              <th>To</th>
              <th>Amount</th>
              <th>Commission</th>
              <th>Method</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((txn) => (
              <tr key={txn.id}>
                <td className="txn-id">{txn.id}</td>
                <td>
                  <div className={`type-badge ${txn.type}`}>
                    {getTypeIcon(txn.type)}
                    <span>{formatType(txn.type)}</span>
                  </div>
                </td>
                <td>{txn.orderTitle}</td>
                <td>
                  <div className="user-cell">
                    <span className={`role-dot ${txn.fromUser.role}`} />
                    {txn.fromUser.name}
                  </div>
                </td>
                <td>
                  <div className="user-cell">
                    <span className={`role-dot ${txn.toUser.role}`} />
                    {txn.toUser.name}
                  </div>
                </td>
                <td className="amount">${txn.amount.toLocaleString()}</td>
                <td className="commission">
                  {txn.commission > 0 ? `$${txn.commission.toLocaleString()}` : '-'}
                </td>
                <td>{txn.paymentMethod}</td>
                <td>
                  <span className={`status-badge status-${txn.status}`}>
                    {getStatusIcon(txn.status)}
                    {txn.status}
                  </span>
                </td>
                <td className="date">
                  {new Date(txn.createdAt).toLocaleDateString()}
                </td>
                <td>
                  <button className="btn-icon" title="View Details">
                    <Eye size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredTransactions.length === 0 && (
          <div className="empty-state">
            <DollarSign size={48} />
            <h3>No transactions found</h3>
            <p>Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
