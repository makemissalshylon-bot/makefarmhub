import { useState, useEffect } from 'react';
import { useToast } from '../../components/UI/Toast';
import {
  Search,
  ChevronDown,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  AlertCircle,
  MessageSquare,
  DollarSign,
  User,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { isSupabaseReady } from '../../lib/supabase';
import { adminService } from '../../services/supabase/adminService';
import type { Dispute } from '../../types';

export default function AdminDisputes() {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [disputes, setDisputes] = useState<Dispute[]>([]);

  useEffect(() => {
    if (isSupabaseReady()) {
      adminService.getAllDisputes().then(data => {
        if (data.length > 0) {
          setDisputes(data.map((d: any) => ({
            id: d.id,
            orderId: d.order_id,
            orderTitle: d.order_title || 'Order',
            raisedBy: { id: d.raised_by, name: d.raised_by_name || 'User', role: d.raised_by_role || 'buyer' },
            against: { id: d.against_user, name: d.against_name || 'User', role: d.against_role || 'farmer' },
            reason: d.reason,
            description: d.description,
            status: d.status,
            amount: Number(d.amount || 0),
            evidence: d.evidence || [],
            createdAt: d.created_at,
            resolvedAt: d.resolved_at,
            resolution: d.resolution,
          })));
        }
      }).catch(() => {});
    }
  }, []);

  const filteredDisputes = disputes.filter((dispute) => {
    const matchesSearch =
      dispute.orderTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.raisedBy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.against.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || dispute.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: disputes.length,
    open: disputes.filter((d) => d.status === 'open').length,
    investigating: disputes.filter((d) => d.status === 'investigating').length,
    escalated: disputes.filter((d) => d.status === 'escalated').length,
    resolved: disputes.filter((d) => d.status === 'resolved').length,
  };

  const handleStartInvestigation = () => {
    if (!selectedDispute) return;
    setDisputes(prev => prev.map(d => 
      d.id === selectedDispute.id ? { ...d, status: 'investigating' } : d
    ));
    setSelectedDispute({ ...selectedDispute, status: 'investigating' });
    showToast('success', 'Investigation started');
  };

  const handleEscalate = () => {
    if (!selectedDispute) return;
    setDisputes(prev => prev.map(d => 
      d.id === selectedDispute.id ? { ...d, status: 'escalated' } : d
    ));
    setSelectedDispute({ ...selectedDispute, status: 'escalated' });
    showToast('warning', 'Dispute escalated');
  };

  const handleResolve = () => {
    if (!selectedDispute) return;
    const resolution = prompt('Enter resolution details:');
    if (resolution) {
      setDisputes(prev => prev.map(d => 
        d.id === selectedDispute.id 
          ? { ...d, status: 'resolved', resolution, resolvedAt: new Date().toISOString() } 
          : d
      ));
      setSelectedDispute({ 
        ...selectedDispute, 
        status: 'resolved', 
        resolution, 
        resolvedAt: new Date().toISOString() 
      });
      showToast('success', 'Dispute resolved successfully');
    }
  };

  const handleContactParties = () => {
    showToast('info', 'Opening messaging system...');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle size={16} />;
      case 'investigating':
        return <Clock size={16} />;
      case 'escalated':
        return <AlertTriangle size={16} />;
      case 'resolved':
        return <CheckCircle size={16} />;
      default:
        return null;
    }
  };

  return (
    <div className="admin-page disputes-page">
      <div className="admin-page-header">
        <div>
          <h1>Dispute Management</h1>
          <p>Review and resolve disputes between users</p>
        </div>
      </div>

      {/* Stats */}
      <div className="dispute-stats-grid">
        <div className="dispute-stat-card total">
          <AlertTriangle size={24} />
          <div>
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Disputes</span>
          </div>
        </div>
        <div className="dispute-stat-card open">
          <AlertCircle size={24} />
          <div>
            <span className="stat-value">{stats.open}</span>
            <span className="stat-label">Open</span>
          </div>
        </div>
        <div className="dispute-stat-card investigating">
          <Clock size={24} />
          <div>
            <span className="stat-value">{stats.investigating}</span>
            <span className="stat-label">Investigating</span>
          </div>
        </div>
        <div className="dispute-stat-card escalated">
          <AlertTriangle size={24} />
          <div>
            <span className="stat-value">{stats.escalated}</span>
            <span className="stat-label">Escalated</span>
          </div>
        </div>
        <div className="dispute-stat-card resolved">
          <CheckCircle size={24} />
          <div>
            <span className="stat-value">{stats.resolved}</span>
            <span className="stat-label">Resolved</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search disputes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="status-tabs">
          <button
            className={`status-tab ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All
          </button>
          <button
            className={`status-tab ${statusFilter === 'open' ? 'active' : ''}`}
            onClick={() => setStatusFilter('open')}
          >
            <AlertCircle size={16} /> Open ({stats.open})
          </button>
          <button
            className={`status-tab ${statusFilter === 'investigating' ? 'active' : ''}`}
            onClick={() => setStatusFilter('investigating')}
          >
            <Clock size={16} /> Investigating ({stats.investigating})
          </button>
          <button
            className={`status-tab ${statusFilter === 'escalated' ? 'active' : ''}`}
            onClick={() => setStatusFilter('escalated')}
          >
            <AlertTriangle size={16} /> Escalated ({stats.escalated})
          </button>
          <button
            className={`status-tab ${statusFilter === 'resolved' ? 'active' : ''}`}
            onClick={() => setStatusFilter('resolved')}
          >
            <CheckCircle size={16} /> Resolved ({stats.resolved})
          </button>
        </div>
      </div>

      {/* Disputes List */}
      <div className="disputes-container">
        <div className="disputes-list-panel">
          {filteredDisputes.map((dispute) => (
            <div
              key={dispute.id}
              className={`dispute-card ${selectedDispute?.id === dispute.id ? 'selected' : ''}`}
              onClick={() => setSelectedDispute(dispute)}
            >
              <div className="dispute-card-header">
                <span className={`dispute-status ${dispute.status}`}>
                  {getStatusIcon(dispute.status)}
                  {dispute.status}
                </span>
                <span className="dispute-amount">${dispute.amount}</span>
              </div>
              <h4>{dispute.orderTitle}</h4>
              <p className="dispute-reason">{dispute.reason}</p>
              <div className="dispute-parties">
                <span className={`party ${dispute.raisedBy.role}`}>
                  {dispute.raisedBy.name}
                </span>
                <span className="vs">vs</span>
                <span className={`party ${dispute.against.role}`}>
                  {dispute.against.name}
                </span>
              </div>
              <div className="dispute-date">
                {new Date(dispute.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}

          {filteredDisputes.length === 0 && (
            <div className="empty-state">
              <CheckCircle size={48} />
              <h3>No disputes found</h3>
              <p>All clear!</p>
            </div>
          )}
        </div>

        {/* Dispute Detail Panel */}
        {selectedDispute ? (
          <div className="dispute-detail-panel">
            <div className="detail-header">
              <h2>Dispute Details</h2>
              <span className={`dispute-status large ${selectedDispute.status}`}>
                {getStatusIcon(selectedDispute.status)}
                {selectedDispute.status}
              </span>
            </div>

            <div className="detail-section">
              <h3>
                <FileText size={18} /> Order Information
              </h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Order ID</span>
                  <span className="value">{selectedDispute.orderId}</span>
                </div>
                <div className="info-item">
                  <span className="label">Product</span>
                  <span className="value">{selectedDispute.orderTitle}</span>
                </div>
                <div className="info-item">
                  <span className="label">Amount in Dispute</span>
                  <span className="value amount">${selectedDispute.amount}</span>
                </div>
                <div className="info-item">
                  <span className="label">Date Raised</span>
                  <span className="value">
                    {new Date(selectedDispute.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h3>
                <User size={18} /> Parties Involved
              </h3>
              <div className="parties-detail">
                <div className="party-card raised-by">
                  <span className="party-label">Raised By</span>
                  <div className="party-info">
                    <span className={`role-badge ${selectedDispute.raisedBy.role}`}>
                      {selectedDispute.raisedBy.role}
                    </span>
                    <span className="party-name">{selectedDispute.raisedBy.name}</span>
                  </div>
                </div>
                <div className="vs-divider">VS</div>
                <div className="party-card against">
                  <span className="party-label">Against</span>
                  <div className="party-info">
                    <span className={`role-badge ${selectedDispute.against.role}`}>
                      {selectedDispute.against.role}
                    </span>
                    <span className="party-name">{selectedDispute.against.name}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h3>
                <AlertTriangle size={18} /> Dispute Reason
              </h3>
              <div className="reason-badge">{selectedDispute.reason}</div>
              <p className="description">{selectedDispute.description}</p>
            </div>

            {selectedDispute.evidence.length > 0 && (
              <div className="detail-section">
                <h3>📎 Evidence</h3>
                <div className="evidence-list">
                  {selectedDispute.evidence.map((url, index) => (
                    <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="evidence-link">
                      Evidence {index + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {selectedDispute.resolution && (
              <div className="detail-section resolution">
                <h3>
                  <CheckCircle size={18} /> Resolution
                </h3>
                <p>{selectedDispute.resolution}</p>
                <span className="resolved-date">
                  Resolved on {new Date(selectedDispute.resolvedAt!).toLocaleString()}
                </span>
              </div>
            )}

            {selectedDispute.status !== 'resolved' && (
              <div className="detail-actions">
                <button className="btn-secondary" onClick={handleContactParties}>
                  <MessageSquare size={18} /> Contact Parties
                </button>
                {selectedDispute.status === 'open' && (
                  <button className="btn-primary" onClick={handleStartInvestigation}>
                    Start Investigation
                  </button>
                )}
                {selectedDispute.status === 'investigating' && (
                  <>
                    <button className="btn-outline warning" onClick={handleEscalate}>
                      Escalate
                    </button>
                    <button className="btn-primary" onClick={handleResolve}>
                      Resolve Dispute
                    </button>
                  </>
                )}
                {selectedDispute.status === 'escalated' && (
                  <button className="btn-primary" onClick={handleResolve}>
                    Resolve Dispute
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="dispute-detail-panel empty">
            <div className="placeholder-content">
              <AlertTriangle size={48} />
              <h3>Select a dispute</h3>
              <p>Click on a dispute to view details and take action</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
