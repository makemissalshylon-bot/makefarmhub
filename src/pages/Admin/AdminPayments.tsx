import { useState, useEffect } from 'react';
import {
  Search,
  ChevronDown,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  AlertTriangle,
  Download,
  Eye,
} from 'lucide-react';
import { isSupabaseReady } from '../../lib/supabase';
import { adminService } from '../../services/supabase/adminService';
import { mockEscrowPayments, mockOrders } from '../../data/mockData';

export default function AdminPayments() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [orders, setOrders] = useState<any[]>(mockOrders);

  // Build payments from orders
  const buildPayments = (orderList: any[]) => orderList
    .filter((o: any) => o.totalPrice || o.total_price)
    .map((o: any, index: number) => ({
      id: o.id,
      orderId: o.id,
      totalAmount: Number(o.totalPrice || o.total_price || 0),
      platformFee: Number(o.totalPrice || o.total_price || 0) * 0.05,
      status: o.status === 'completed' || o.status === 'delivered' ? 'released' : o.status === 'cancelled' ? 'refunded' : 'held',
      paymentMethod: o.paymentMethod || o.payment_method || 'Wallet',
      createdAt: o.createdAt || o.created_at,
      requiresApproval: o.status === 'delivered',
      approvalStatus: o.status === 'delivered' ? 'pending' : 'approved',
      listingTitle: o.listingTitle || o.listing_title || 'Order',
    }));

  const [paymentsWithApproval, setPaymentsWithApproval] = useState<any[]>(() => {
    const mockPayments = mockEscrowPayments.map((payment, index) => ({
      ...payment,
      requiresApproval: index % 3 === 0,
      approvalStatus: index % 3 === 0 ? 'pending' : 'approved',
      listingTitle: mockOrders.find(o => o.id === payment.orderId)?.listingTitle || 'Order',
    }));
    return mockPayments;
  });

  useEffect(() => {
    if (isSupabaseReady()) {
      adminService.getAllOrders().then(data => {
        if (data.length > 0) {
          setOrders(data);
          setPaymentsWithApproval(buildPayments(data));
        }
      }).catch(() => {});
    }
  }, []);

  const filteredPayments = paymentsWithApproval.filter((payment) => {
    const matchesSearch = (payment as any).listingTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.orderId?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: paymentsWithApproval.length,
    pending: paymentsWithApproval.filter((p) => p.approvalStatus === 'pending').length,
    held: paymentsWithApproval.filter((p) => p.status === 'held').length,
    released: paymentsWithApproval.filter((p) => p.status === 'released').length,
    totalAmount: paymentsWithApproval.reduce((sum, p) => sum + p.totalAmount, 0),
  };

  const handleSelectAll = () => {
    if (selectedPayments.length === filteredPayments.length) {
      setSelectedPayments([]);
    } else {
      setSelectedPayments(filteredPayments.map((p) => p.id));
    }
  };

  const handleSelectPayment = (paymentId: string) => {
    setSelectedPayments((prev) =>
      prev.includes(paymentId) ? prev.filter((id) => id !== paymentId) : [...prev, paymentId]
    );
  };

  const handleApprovePayment = (paymentId: string) => {
    // API call to approve payment release
  };

  const handleRejectPayment = (paymentId: string) => {
    // API call to reject payment release
  };

  const handleBulkApprove = () => {
    setSelectedPayments([]);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Payment Management</h1>
          <p>Approve escrow releases and manage platform payments</p>
        </div>
        <button className="btn-secondary">
          <Download size={18} /> Export Report
        </button>
      </div>

      {/* Stats */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card primary">
          <DollarSign size={24} />
          <div>
            <span className="stat-value">${stats.totalAmount.toLocaleString()}</span>
            <span className="stat-label">Total in Escrow</span>
          </div>
        </div>
        <div className="admin-stat-card warning">
          <Clock size={24} />
          <div>
            <span className="stat-value">{stats.pending}</span>
            <span className="stat-label">Pending Approval</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <AlertTriangle size={24} />
          <div>
            <span className="stat-value">{stats.held}</span>
            <span className="stat-label">Held in Escrow</span>
          </div>
        </div>
        <div className="admin-stat-card success">
          <CheckCircle size={24} />
          <div>
            <span className="stat-value">{stats.released}</span>
            <span className="stat-label">Released</span>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedPayments.length > 0 && (
        <div className="bulk-actions-bar">
          <span>{selectedPayments.length} payment(s) selected</span>
          <div className="bulk-actions">
            <button className="btn-bulk verify" onClick={handleBulkApprove}>
              <CheckCircle size={16} />
              Approve Selected
            </button>
            <button className="btn-bulk cancel" onClick={() => setSelectedPayments([])}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="admin-filters">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by order..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Status</label>
          <div className="select-wrapper">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="held">Held</option>
              <option value="released">Released</option>
              <option value="refunded">Refunded</option>
            </select>
            <ChevronDown size={16} />
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedPayments.length === filteredPayments.length && filteredPayments.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th>Order ID</th>
              <th>Amount</th>
              <th>Platform Fee</th>
              <th>Status</th>
              <th>Payment Method</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.map((payment) => {
              return (
                <tr key={payment.id} className={selectedPayments.includes(payment.id) ? 'selected' : ''}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedPayments.includes(payment.id)}
                      onChange={() => handleSelectPayment(payment.id)}
                    />
                  </td>
                  <td>
                    <div>
                      <strong>{payment.orderId.slice(-8)}</strong>
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                        {(payment as any).listingTitle || 'Unknown'}
                      </div>
                    </div>
                  </td>
                  <td>
                    <strong>${payment.totalAmount.toFixed(2)}</strong>
                  </td>
                  <td>
                    <span style={{ color: '#2E7D32' }}>${payment.platformFee.toFixed(2)}</span>
                  </td>
                  <td>
                    <span className={`status-badge status-${payment.status}`}>
                      {payment.status === 'held' && <Clock size={14} />}
                      {payment.status === 'released' && <CheckCircle size={14} />}
                      {payment.status === 'pending' && <AlertTriangle size={14} />}
                      {payment.status}
                    </span>
                  </td>
                  <td>{payment.paymentMethod}</td>
                  <td>{formatDate(payment.createdAt)}</td>
                  <td>
                    <div className="action-buttons">
                      {payment.requiresApproval && payment.approvalStatus === 'pending' ? (
                        <>
                          <button
                            className="btn-icon verify"
                            title="Approve Release"
                            onClick={() => handleApprovePayment(payment.id)}
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button
                            className="btn-icon ban"
                            title="Reject Release"
                            onClick={() => handleRejectPayment(payment.id)}
                          >
                            <XCircle size={18} />
                          </button>
                        </>
                      ) : (
                        <button className="btn-icon" title="View Details">
                          <Eye size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredPayments.length === 0 && (
          <div className="empty-state">
            <DollarSign size={48} />
            <h3>No payments found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
