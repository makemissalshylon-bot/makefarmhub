/**
 * Data Export Utilities
 * Export data to CSV, PDF, and Excel formats
 */

interface ExportData {
  headers: string[];
  rows: any[][];
  filename: string;
}

/**
 * Export data to CSV
 */
export function exportToCSV(data: ExportData): void {
  const { headers, rows, filename } = data;
  
  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => {
      // Escape quotes and wrap in quotes if contains comma
      const cellStr = String(cell ?? '');
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    }).join(','))
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
}

/**
 * Export data to JSON
 */
export function exportToJSON(data: any, filename: string): void {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  downloadBlob(blob, `${filename}.json`);
}

/**
 * Export table to PDF (requires jsPDF)
 */
export async function exportToPDF(data: ExportData): Promise<void> {
  const { headers, rows, filename } = data;
  
  // Dynamic import to reduce bundle size
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();

  // Add title
  doc.setFontSize(16);
  doc.text(filename, 14, 15);

  // Add table
  let yPosition = 25;
  doc.setFontSize(10);

  // Headers
  doc.setFont(undefined, 'bold');
  headers.forEach((header, i) => {
    doc.text(header, 14 + (i * 40), yPosition);
  });

  // Rows
  doc.setFont(undefined, 'normal');
  rows.forEach((row, rowIndex) => {
    yPosition += 7;
    
    // Add new page if needed
    if (yPosition > 280) {
      doc.addPage();
      yPosition = 15;
    }

    row.forEach((cell, i) => {
      doc.text(String(cell ?? ''), 14 + (i * 40), yPosition);
    });
  });

  // Download
  doc.save(`${filename}.pdf`);
}

/**
 * Export to Excel (XLSX)
 */
export async function exportToExcel(data: ExportData): Promise<void> {
  const { headers, rows, filename } = data;
  
  // Dynamic import
  const XLSX = await import('xlsx');

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

  // Download
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/**
 * Helper: Download blob
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export orders to CSV
 */
export function exportOrders(orders: any[]): void {
  const data: ExportData = {
    filename: `orders-${new Date().toISOString().split('T')[0]}`,
    headers: ['Order ID', 'Date', 'Customer', 'Product', 'Quantity', 'Total', 'Status'],
    rows: orders.map(order => [
      order.id,
      new Date(order.createdAt).toLocaleDateString(),
      order.buyerName,
      order.productName,
      order.quantity,
      `$${order.totalPrice.toFixed(2)}`,
      order.status,
    ]),
  };

  exportToCSV(data);
}

/**
 * Export transactions to CSV
 */
export function exportTransactions(transactions: any[]): void {
  const data: ExportData = {
    filename: `transactions-${new Date().toISOString().split('T')[0]}`,
    headers: ['Transaction ID', 'Date', 'Type', 'Amount', 'Status', 'Description'],
    rows: transactions.map(tx => [
      tx.id,
      new Date(tx.created_at).toLocaleDateString(),
      tx.type,
      `$${tx.amount.toFixed(2)}`,
      tx.status,
      tx.description,
    ]),
  };

  exportToCSV(data);
}

/**
 * Export users to CSV
 */
export function exportUsers(users: any[]): void {
  const data: ExportData = {
    filename: `users-${new Date().toISOString().split('T')[0]}`,
    headers: ['ID', 'Name', 'Email', 'Phone', 'Role', 'Verified', 'Joined'],
    rows: users.map(user => [
      user.id,
      user.name,
      user.email,
      user.phone,
      user.role,
      user.verified ? 'Yes' : 'No',
      new Date(user.created_at).toLocaleDateString(),
    ]),
  };

  exportToCSV(data);
}

/**
 * Export analytics report
 */
export async function exportAnalyticsReport(analytics: {
  revenue: any[];
  orders: any[];
  users: any[];
}): Promise<void> {
  const XLSX = await import('xlsx');

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Revenue sheet
  const revenueWS = XLSX.utils.json_to_sheet(analytics.revenue);
  XLSX.utils.book_append_sheet(wb, revenueWS, 'Revenue');

  // Orders sheet
  const ordersWS = XLSX.utils.json_to_sheet(analytics.orders);
  XLSX.utils.book_append_sheet(wb, ordersWS, 'Orders');

  // Users sheet
  const usersWS = XLSX.utils.json_to_sheet(analytics.users);
  XLSX.utils.book_append_sheet(wb, usersWS, 'Users');

  // Download
  XLSX.writeFile(wb, `analytics-report-${new Date().toISOString().split('T')[0]}.xlsx`);
}
