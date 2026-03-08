import { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, Check, X, AlertCircle, HelpCircle } from 'lucide-react';
import { useToast } from '../UI/Toast';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseReady } from '../../lib/supabase';
import { listingService } from '../../services/supabase/listingService';
import './BulkUpload.css';

interface ParsedListing {
  title: string;
  description: string;
  category: string;
  subcategory: string;
  price: number;
  unit: string;
  quantity: number;
  location: string;
  organic: boolean;
  valid: boolean;
  errors: string[];
}

export default function BulkUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedListing[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const { user } = useAuth();

  const downloadTemplate = () => {
    const headers = ['Title', 'Description', 'Category', 'Subcategory', 'Price', 'Unit', 'Quantity', 'Location', 'Organic'];
    const sampleData = [
      ['Fresh Tomatoes', 'Organic vine-ripened tomatoes', 'crops', 'vegetables', '5.00', 'kg', '100', 'Harare', 'yes'],
      ['Broiler Chickens', 'Free-range broiler chickens', 'livestock', 'poultry', '15.00', 'each', '50', 'Bulawayo', 'no'],
    ];

    const csvContent = [headers.join(','), ...sampleData.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'makefarmhub_listing_template.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('success', 'Template downloaded!');
  };

  const parseCSV = (text: string): ParsedListing[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const errors: string[] = [];

      const title = values[headers.indexOf('title')] || '';
      const description = values[headers.indexOf('description')] || '';
      const category = values[headers.indexOf('category')] || '';
      const subcategory = values[headers.indexOf('subcategory')] || '';
      const price = parseFloat(values[headers.indexOf('price')]) || 0;
      const unit = values[headers.indexOf('unit')] || '';
      const quantity = parseInt(values[headers.indexOf('quantity')]) || 0;
      const location = values[headers.indexOf('location')] || '';
      const organic = values[headers.indexOf('organic')]?.toLowerCase() === 'yes';

      // Validation
      if (!title) errors.push('Title is required');
      if (!description) errors.push('Description is required');
      if (!['crops', 'livestock', 'equipment'].includes(category)) errors.push('Invalid category');
      if (price <= 0) errors.push('Price must be greater than 0');
      if (!unit) errors.push('Unit is required');
      if (quantity <= 0) errors.push('Quantity must be greater than 0');
      if (!location) errors.push('Location is required');

      return {
        title,
        description,
        category,
        subcategory,
        price,
        unit,
        quantity,
        location,
        organic,
        valid: errors.length === 0,
        errors,
      };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      showToast('error', 'Please upload a CSV file');
      return;
    }

    setFile(selectedFile);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCSV(text);
      setParsedData(parsed);
      setIsProcessing(false);

      const validCount = parsed.filter(p => p.valid).length;
      showToast('info', `Parsed ${parsed.length} listings (${validCount} valid)`);
    };
    reader.readAsText(selectedFile);
  };

  const handleUpload = async () => {
    const validListings = parsedData.filter(p => p.valid);
    if (validListings.length === 0) {
      showToast('error', 'No valid listings to upload');
      return;
    }

    setIsProcessing(true);
    try {
      if (isSupabaseReady() && user) {
        for (const listing of validListings) {
          await listingService.create({
            seller_id: user.id,
            title: listing.title,
            description: listing.description,
            category: listing.category,
            subcategory: listing.subcategory,
            price: listing.price,
            unit: listing.unit,
            quantity: listing.quantity,
            location: listing.location,
            organic: listing.organic,
          });
        }
      }
      showToast('success', `Successfully uploaded ${validListings.length} listings!`);
      setFile(null);
      setParsedData([]);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to upload listings');
    } finally {
      setIsProcessing(false);
    }
  };

  const removeItem = (index: number) => {
    setParsedData(prev => prev.filter((_, i) => i !== index));
  };

  const validCount = parsedData.filter(p => p.valid).length;
  const invalidCount = parsedData.filter(p => !p.valid).length;

  return (
    <div className="bulk-upload">
      <div className="bulk-upload-header">
        <div>
          <h2>
            <FileSpreadsheet size={24} />
            Bulk Upload Listings
          </h2>
          <p>Upload multiple listings at once using a CSV file</p>
        </div>
        <button className="btn-help" onClick={() => setShowHelp(!showHelp)}>
          <HelpCircle size={20} />
          Help
        </button>
      </div>

      {showHelp && (
        <div className="help-panel">
          <h4>How to use bulk upload:</h4>
          <ol>
            <li>Download the CSV template using the button below</li>
            <li>Fill in your listing details in the spreadsheet</li>
            <li>Save the file as CSV format</li>
            <li>Upload the file here</li>
            <li>Review and confirm your listings</li>
          </ol>
          <h4>Required columns:</h4>
          <ul>
            <li><strong>Title</strong> - Product name</li>
            <li><strong>Description</strong> - Product description</li>
            <li><strong>Category</strong> - crops, livestock, or equipment</li>
            <li><strong>Subcategory</strong> - e.g., vegetables, poultry</li>
            <li><strong>Price</strong> - Price per unit (number)</li>
            <li><strong>Unit</strong> - e.g., kg, each, bag</li>
            <li><strong>Quantity</strong> - Available quantity (number)</li>
            <li><strong>Location</strong> - Your location</li>
            <li><strong>Organic</strong> - yes or no</li>
          </ul>
        </div>
      )}

      <div className="upload-actions">
        <button className="btn-template" onClick={downloadTemplate}>
          <Download size={18} />
          Download Template
        </button>

        <div className="upload-zone" onClick={() => fileInputRef.current?.click()}>
          <Upload size={32} />
          <span>{file ? file.name : 'Click to upload CSV file'}</span>
          <small>or drag and drop</small>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>

      {parsedData.length > 0 && (
        <>
          <div className="upload-summary">
            <div className="summary-stat valid">
              <Check size={20} />
              <span>{validCount} Valid</span>
            </div>
            <div className="summary-stat invalid">
              <AlertCircle size={20} />
              <span>{invalidCount} Invalid</span>
            </div>
          </div>

          <div className="parsed-listings">
            <h3>Preview Listings</h3>
            <div className="listings-table">
              <div className="table-header">
                <span>Status</span>
                <span>Title</span>
                <span>Category</span>
                <span>Price</span>
                <span>Qty</span>
                <span>Actions</span>
              </div>
              {parsedData.map((listing, index) => (
                <div key={index} className={`table-row ${listing.valid ? 'valid' : 'invalid'}`}>
                  <span className="status-cell">
                    {listing.valid ? (
                      <Check size={16} className="icon-valid" />
                    ) : (
                      <AlertCircle size={16} className="icon-invalid" />
                    )}
                  </span>
                  <span className="title-cell">
                    {listing.title || 'No title'}
                    {!listing.valid && (
                      <div className="error-list">
                        {listing.errors.map((err, i) => (
                          <small key={i}>{err}</small>
                        ))}
                      </div>
                    )}
                  </span>
                  <span>{listing.category}</span>
                  <span>${listing.price.toFixed(2)}</span>
                  <span>{listing.quantity}</span>
                  <span>
                    <button className="btn-remove" onClick={() => removeItem(index)}>
                      <X size={16} />
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="upload-footer">
            <button className="btn-cancel" onClick={() => { setFile(null); setParsedData([]); }}>
              Cancel
            </button>
            <button
              className="btn-upload"
              onClick={handleUpload}
              disabled={validCount === 0 || isProcessing}
            >
              {isProcessing ? 'Uploading...' : `Upload ${validCount} Listings`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
