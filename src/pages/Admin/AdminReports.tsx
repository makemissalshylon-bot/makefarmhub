import { useState } from 'react';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Users,
  ShoppingBag,
  DollarSign,
  Package,
  AlertTriangle,
  Clock,
  CheckCircle,
} from 'lucide-react';

type ReportType = 'revenue' | 'users' | 'orders' | 'listings' | 'disputes' | 'transactions' | 'custom';

interface GeneratedReport {
  id: string;
  type: string;
  name: string;
  dateRange: string;
  generatedAt: string;
  fileSize: string;
  status: 'ready' | 'generating' | 'failed';
}

export default function AdminReports() {
  const [selectedReport, setSelectedReport] = useState<ReportType>('revenue');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const [generatedReports] = useState<GeneratedReport[]>([
    {
      id: 'rep-1',
      type: 'Revenue Report',
      name: 'revenue-report-nov-2024.pdf',
      dateRange: 'Nov 1 - Nov 30, 2024',
      generatedAt: '2024-11-30T15:30:00Z',
      fileSize: '2.4 MB',
      status: 'ready',
    },
    {
      id: 'rep-2',
      type: 'User Activity Report',
      name: 'user-activity-q4-2024.xlsx',
      dateRange: 'Oct 1 - Dec 31, 2024',
      generatedAt: '2024-11-28T10:15:00Z',
      fileSize: '1.8 MB',
      status: 'ready',
    },
    {
      id: 'rep-3',
      type: 'Transaction Summary',
      name: 'transactions-weekly.csv',
      dateRange: 'Nov 20 - Nov 27, 2024',
      generatedAt: '2024-11-27T08:00:00Z',
      fileSize: '850 KB',
      status: 'ready',
    },
  ]);

  const reportTypes = [
    {
      id: 'revenue' as const,
      name: 'Revenue Report',
      description: 'Total revenue, commissions, and financial overview',
      icon: DollarSign,
      metrics: ['Total Revenue', 'Platform Fees', 'Escrow Balance', 'Payouts'],
    },
    {
      id: 'users' as const,
      name: 'User Analytics',
      description: 'User registrations, activity, and demographics',
      icon: Users,
      metrics: ['New Users', 'Active Users', 'User Retention', 'Verification Rate'],
    },
    {
      id: 'orders' as const,
      name: 'Orders Report',
      description: 'Order volume, completion rates, and trends',
      icon: ShoppingBag,
      metrics: ['Total Orders', 'Completed Orders', 'Cancellations', 'Average Order Value'],
    },
    {
      id: 'listings' as const,
      name: 'Listings Report',
      description: 'Product listings, categories, and performance',
      icon: Package,
      metrics: ['Active Listings', 'New Listings', 'Top Categories', 'Conversion Rate'],
    },
    {
      id: 'disputes' as const,
      name: 'Disputes Report',
      description: 'Dispute cases, resolution times, and outcomes',
      icon: AlertTriangle,
      metrics: ['Open Disputes', 'Resolved Disputes', 'Resolution Time', 'Refund Amount'],
    },
    {
      id: 'transactions' as const,
      name: 'Transaction Log',
      description: 'All platform transactions and payment activity',
      icon: FileText,
      metrics: ['Total Transactions', 'Escrow Payments', 'Refunds', 'Failed Payments'],
    },
  ];

  const handleGenerateReport = () => {
    setIsGenerating(true);
    
    // Simulate report generation
    setTimeout(() => {
      setIsGenerating(false);
      alert(`${reportTypes.find(r => r.id === selectedReport)?.name} generated successfully!`);
    }, 2000);
  };

  const handleDownloadReport = (reportId: string) => {
    // In real app, this would trigger file download
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const selectedReportDetails = reportTypes.find(r => r.id === selectedReport);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Reports & Analytics</h1>
          <p>Generate detailed reports about your platform</p>
        </div>
      </div>

      {/* Report Generator */}
      <div className="report-generator-section">
        <div className="report-types-grid">
          {reportTypes.map((report) => (
            <div
              key={report.id}
              className={`report-type-card ${selectedReport === report.id ? 'selected' : ''}`}
              onClick={() => setSelectedReport(report.id)}
            >
              <div className="report-icon">
                <report.icon size={24} />
              </div>
              <h3>{report.name}</h3>
              <p>{report.description}</p>
            </div>
          ))}
        </div>

        {/* Report Configuration */}
        <div className="report-config-card">
          <h2>
            {selectedReportDetails?.icon && <selectedReportDetails.icon size={24} />}
            {selectedReportDetails?.name}
          </h2>
          <p>{selectedReportDetails?.description}</p>

          <div className="report-metrics">
            <h4>Included Metrics:</h4>
            <div className="metrics-list">
              {selectedReportDetails?.metrics.map((metric, idx) => (
                <span key={idx} className="metric-tag">
                  <CheckCircle size={14} /> {metric}
                </span>
              ))}
            </div>
          </div>

          <div className="date-range-selector">
            <h4>Date Range:</h4>
            <div className="date-inputs">
              <div className="form-group">
                <label>From</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>To</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                />
              </div>
            </div>
            <div className="quick-dates">
              <button onClick={() => {
                const end = new Date();
                const start = new Date();
                start.setDate(start.getDate() - 7);
                setDateRange({
                  start: start.toISOString().split('T')[0],
                  end: end.toISOString().split('T')[0],
                });
              }}>Last 7 Days</button>
              <button onClick={() => {
                const end = new Date();
                const start = new Date();
                start.setDate(start.getDate() - 30);
                setDateRange({
                  start: start.toISOString().split('T')[0],
                  end: end.toISOString().split('T')[0],
                });
              }}>Last 30 Days</button>
              <button onClick={() => {
                const end = new Date();
                const start = new Date();
                start.setMonth(start.getMonth() - 3);
                setDateRange({
                  start: start.toISOString().split('T')[0],
                  end: end.toISOString().split('T')[0],
                });
              }}>Last 3 Months</button>
            </div>
          </div>

          <div className="export-format">
            <h4>Export Format:</h4>
            <div className="format-options">
              <label>
                <input type="radio" name="format" value="pdf" defaultChecked />
                PDF Document
              </label>
              <label>
                <input type="radio" name="format" value="excel" />
                Excel Spreadsheet
              </label>
              <label>
                <input type="radio" name="format" value="csv" />
                CSV File
              </label>
            </div>
          </div>

          <button
            className="btn-generate-report"
            onClick={handleGenerateReport}
            disabled={isGenerating || !dateRange.start || !dateRange.end}
          >
            {isGenerating ? (
              <>
                <Clock size={18} className="spinner" />
                Generating...
              </>
            ) : (
              <>
                <FileText size={18} />
                Generate Report
              </>
            )}
          </button>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="admin-card">
        <div className="card-header">
          <h2>Recent Reports</h2>
        </div>

        <div className="reports-list">
          {generatedReports.map((report) => (
            <div key={report.id} className="report-item">
              <div className="report-icon-preview">
                <FileText size={32} />
              </div>
              <div className="report-details">
                <h4>{report.type}</h4>
                <p className="report-filename">{report.name}</p>
                <div className="report-meta">
                  <span className="date-range">
                    <Calendar size={14} /> {report.dateRange}
                  </span>
                  <span className="generated-at">
                    Generated: {formatDate(report.generatedAt)}
                  </span>
                  <span className="file-size">{report.fileSize}</span>
                </div>
              </div>
              <div className="report-actions">
                <span className={`report-status ${report.status}`}>
                  {report.status === 'ready' && <CheckCircle size={14} />}
                  {report.status === 'generating' && <Clock size={14} />}
                  {report.status}
                </span>
                {report.status === 'ready' && (
                  <button
                    className="btn-download-report"
                    onClick={() => handleDownloadReport(report.id)}
                  >
                    <Download size={18} />
                    Download
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="quick-stats-grid">
        <div className="stat-card">
          <TrendingUp size={24} />
          <div>
            <span className="stat-value">$124,580</span>
            <span className="stat-label">Total Revenue (This Month)</span>
          </div>
        </div>
        <div className="stat-card">
          <Users size={24} />
          <div>
            <span className="stat-value">1,250</span>
            <span className="stat-label">Active Users</span>
          </div>
        </div>
        <div className="stat-card">
          <ShoppingBag size={24} />
          <div>
            <span className="stat-value">856</span>
            <span className="stat-label">Orders This Month</span>
          </div>
        </div>
        <div className="stat-card">
          <Package size={24} />
          <div>
            <span className="stat-value">342</span>
            <span className="stat-label">Active Listings</span>
          </div>
        </div>
      </div>
    </div>
  );
}
