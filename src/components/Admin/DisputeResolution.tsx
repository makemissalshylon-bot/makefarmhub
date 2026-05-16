/**
 * Dispute Resolution Interface
 * Admin interface for handling user disputes
 */

import { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Clock, MessageSquare, FileText, DollarSign } from 'lucide-react';

interface Dispute {
  id: string;
  order_id: string;
  raised_by: string;
  raised_by_name: string;
  against: string;
  against_name: string;
  type: 'quality' | 'delivery' | 'payment' | 'other';
  description: string;
  status: 'open' | 'investigating' | 'resolved' | 'escalated';
  amount: number;
  evidence: string[];
  resolution?: string;
  created_at: string;
  resolved_at?: string;
}

interface DisputeResolutionProps {
  disputes: Dispute[];
  onResolve: (disputeId: string, resolution: string, refundAmount?: number) => void;
  onEscalate: (disputeId: string, notes: string) => void;
  onAddNote: (disputeId: string, note: string) => void;
}

export function DisputeResolution({
  disputes,
  onResolve,
  onEscalate,
  onAddNote,
}: DisputeResolutionProps) {
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolution, setResolution] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [note, setNote] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredDisputes = disputes.filter(d => 
    filterStatus === 'all' || d.status === filterStatus
  );

  const statusConfig = {
    open: { color: 'red', icon: AlertTriangle, label: 'Open' },
    investigating: { color: 'yellow', icon: Clock, label: 'Investigating' },
    resolved: { color: 'green', icon: CheckCircle, label: 'Resolved' },
    escalated: { color: 'purple', icon: AlertTriangle, label: 'Escalated' },
  };

  const handleResolve = () => {
    if (!selectedDispute || !resolution) return;
    
    const amount = refundAmount ? parseFloat(refundAmount) : undefined;
    onResolve(selectedDispute.id, resolution, amount);
    setSelectedDispute(null);
    setResolution('');
    setRefundAmount('');
  };

  const handleEscalate = () => {
    if (!selectedDispute) return;
    onEscalate(selectedDispute.id, note);
    setNote('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Disputes List */}
      <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold dark:text-white mb-4">Disputes</h2>
          
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Disputes</option>
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="escalated">Escalated</option>
          </select>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
          {filteredDisputes.map((dispute) => {
            const config = statusConfig[dispute.status];
            const Icon = config.icon;

            return (
              <button
                key={dispute.id}
                onClick={() => setSelectedDispute(dispute)}
                className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                  selectedDispute?.id === dispute.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${config.color}-100 text-${config.color}-800 dark:bg-${config.color}-900 dark:text-${config.color}-200 flex items-center gap-1`}>
                    <Icon className="w-3 h-3" />
                    {config.label}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(dispute.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Order #{dispute.order_id.slice(0, 8)}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  {dispute.description}
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <DollarSign className="w-3 h-3" />
                  ${dispute.amount.toFixed(2)}
                </div>
              </button>
            );
          })}
        </div>

        {filteredDisputes.length === 0 && (
          <div className="p-12 text-center">
            <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No disputes found</p>
          </div>
        )}
      </div>

      {/* Dispute Details */}
      <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow">
        {selectedDispute ? (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold dark:text-white">Dispute Details</h2>
              <span className={`px-3 py-1 text-sm font-medium rounded-full bg-${statusConfig[selectedDispute.status].color}-100 text-${statusConfig[selectedDispute.status].color}-800 dark:bg-${statusConfig[selectedDispute.status].color}-900 dark:text-${statusConfig[selectedDispute.status].color}-200`}>
                {statusConfig[selectedDispute.status].label}
              </span>
            </div>

            {/* Dispute Info */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Order ID
                </label>
                <p className="text-sm text-gray-900 dark:text-white">#{selectedDispute.order_id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Dispute Amount
                </label>
                <p className="text-sm text-gray-900 dark:text-white">${selectedDispute.amount.toFixed(2)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Raised By
                </label>
                <p className="text-sm text-gray-900 dark:text-white">{selectedDispute.raised_by_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Against
                </label>
                <p className="text-sm text-gray-900 dark:text-white">{selectedDispute.against_name}</p>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                {selectedDispute.description}
              </p>
            </div>

            {/* Evidence */}
            {selectedDispute.evidence.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Evidence ({selectedDispute.evidence.length})
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {selectedDispute.evidence.map((url, index) => (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="aspect-square rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 hover:opacity-75 transition-opacity"
                    >
                      <img src={url} alt={`Evidence ${index + 1}`} className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Resolution Actions */}
            {selectedDispute.status !== 'resolved' && (
              <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Resolution Notes
                  </label>
                  <textarea
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Explain your resolution decision..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Refund Amount (Optional)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      step="0.01"
                      max={selectedDispute.amount}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleResolve}
                    disabled={!resolution}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Resolve Dispute
                  </button>
                  <button
                    onClick={handleEscalate}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <AlertTriangle className="w-5 h-5" />
                    Escalate
                  </button>
                </div>
              </div>
            )}

            {/* Resolution Info (if resolved) */}
            {selectedDispute.resolution && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Resolution
                </label>
                <p className="text-sm text-gray-900 dark:text-white bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  {selectedDispute.resolution}
                </p>
                {selectedDispute.resolved_at && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Resolved on {new Date(selectedDispute.resolved_at).toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Select a dispute to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}
