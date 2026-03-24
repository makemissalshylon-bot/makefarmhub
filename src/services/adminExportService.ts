/**
 * Admin Export Service
 * Export reports as CSV and PDF
 */

import { adminService } from './supabase/adminService';

export const adminExportService = {
  /**
   * Export data to CSV
   */
  exportToCSV(data: any[], filename: string) {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          const stringValue = value === null || value === undefined ? '' : String(value);
          // Escape quotes and wrap in quotes if contains comma or quote
          return stringValue.includes(',') || stringValue.includes('"')
            ? `"${stringValue.replace(/"/g, '""')}"`
            : stringValue;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  },

  /**
   * Export transactions to CSV
   */
  async exportTransactions(filters?: { startDate?: string; endDate?: string; type?: string }) {
    // Fetch transactions with filters
    const transactions = await this.fetchTransactionsForExport(filters);
    
    const formattedData = transactions.map(tx => ({
      'Transaction ID': tx.id,
      'Date': new Date(tx.created_at).toLocaleString(),
      'User': tx.user_email || tx.user_id,
      'Type': tx.type,
      'Amount': tx.amount,
      'Status': tx.status,
      'Description': tx.description,
      'Reference': tx.reference || '',
    }));

    this.exportToCSV(formattedData, 'transactions');
  },

  /**
   * Export users to CSV
   */
  async exportUsers(filters?: { role?: string; verified?: boolean }) {
    const users = await this.fetchUsersForExport(filters);
    
    const formattedData = users.map(user => ({
      'User ID': user.id,
      'Name': user.full_name,
      'Email': user.email,
      'Phone': user.phone || '',
      'Role': user.role,
      'Verified': user.verified ? 'Yes' : 'No',
      'Joined': new Date(user.created_at).toLocaleDateString(),
      'Last Active': user.last_seen ? new Date(user.last_seen).toLocaleDateString() : 'Never',
    }));

    this.exportToCSV(formattedData, 'users');
  },

  /**
   * Export orders to CSV
   */
  async exportOrders(filters?: { status?: string; startDate?: string; endDate?: string }) {
    const orders = await this.fetchOrdersForExport(filters);
    
    const formattedData = orders.map(order => ({
      'Order ID': order.id,
      'Date': new Date(order.created_at).toLocaleString(),
      'Buyer': order.buyer_name,
      'Seller': order.seller_name,
      'Product': order.listing_title,
      'Quantity': order.quantity,
      'Total': order.total_amount,
      'Status': order.status,
      'Payment Method': order.payment_method,
    }));

    this.exportToCSV(formattedData, 'orders');
  },

  /**
   * Generate PDF report
   */
  async generatePDFReport(reportType: 'revenue' | 'users' | 'products') {
    // This would typically use a library like jsPDF
    // For now, we'll prepare the data structure
    const reportData = await this.getReportData(reportType);
    
    // Create simple HTML report that can be printed as PDF
    const htmlReport = this.generateHTMLReport(reportType, reportData);
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlReport);
      printWindow.document.close();
      printWindow.print();
    }
  },

  // Helper methods
  async fetchTransactionsForExport(_filters?: any): Promise<Array<{
    id: string; created_at: string; user_email?: string; user_id: string;
    type: string; amount: number; status: string; description: string; reference?: string;
  }>> {
    return [];
  },

  async fetchUsersForExport(_filters?: any): Promise<Array<{
    id: string; full_name: string; email: string; phone?: string;
    role: string; verified: boolean; created_at: string; last_seen?: string;
  }>> {
    return [];
  },

  async fetchOrdersForExport(_filters?: any): Promise<Array<{
    id: string; created_at: string; buyer_name: string; seller_name: string;
    listing_title: string; quantity: number; total_amount: number;
    status: string; payment_method: string;
  }>> {
    return [];
  },

  async getReportData(reportType: string) {
    switch (reportType) {
      case 'revenue':
        return await adminService.getRevenueAnalytics();
      case 'users':
        return await adminService.getUserGrowth();
      case 'products':
        return await adminService.getTopProducts();
      default:
        return null;
    }
  },

  generateHTMLReport(reportType: string, data: any) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>MAKEFARMHUB ${reportType.toUpperCase()} Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #00a651; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #00a651; color: white; }
          .report-meta { color: #666; font-size: 14px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <h1>MAKEFARMHUB - ${reportType.toUpperCase()} Report</h1>
        <div class="report-meta">
          Generated on: ${new Date().toLocaleString()}<br>
          Report Type: ${reportType}
        </div>
        <div id="report-content">
          ${JSON.stringify(data, null, 2)}
        </div>
      </body>
      </html>
    `;
  },
};
