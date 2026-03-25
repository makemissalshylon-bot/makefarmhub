import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/UI/Toast';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { isSupabaseReady } from '../../lib/supabase';
import { listingService } from '../../services/supabase/listingService';
import ImageUpload, { type UploadedImage } from '../../components/Upload/ImageUpload';
import Breadcrumbs from '../../components/UI/Breadcrumbs';
import LoadingState from '../../components/UI/LoadingState';
import {
  X,
  MapPin,
  DollarSign,
  Package,
  ArrowLeft,
  Check,
  Video,
  Truck,
} from 'lucide-react';

type BaseListingData = {
  title: string;
  category: 'crops' | 'livestock' | '';
  location: string;
  images: string[];
  videoUrl: string;
  farmDescription: string;
  deliveryOptions: string[];
  paymentOptions: string[];
  readyToSell: boolean;
  deliveryTerms: string;
};

type CropListingData = BaseListingData & {
  category: 'crops';
  cropType: string;
  qualityGrade: string;
  pricePerKg: string;
  pricePerTon: string;
  availableQuantity: string;
  quantityUnit: 'kg' | 'tonnes';
};

type LivestockListingData = BaseListingData & {
  category: 'livestock';
  animalType: string;
  breed: string;
  age: string;
  sex: 'male' | 'female' | 'mixed';
  weight: string;
  healthStatus: string;
  vaccinationRecord: string;
  pricePerAnimal: string;
  numberOfAnimals: string;
};

const cropTypes = [
  'Maize',
  'Tomatoes',
  'Potatoes',
  'Wheat',
  'Rice',
  'Beans',
  'Cabbage',
  'Onions',
  'Carrots',
  'Bananas',
  'Apples',
  'Oranges',
  'Other',
];

const animalTypes = [
  'Cattle',
  'Goats',
  'Sheep',
  'Pigs',
  'Chickens',
  'Ducks',
  'Turkeys',
  'Rabbits',
];

const qualityGrades = ['Premium', 'Grade A', 'Grade B', 'Grade C', 'Standard'];
const healthStatuses = ['Excellent', 'Good', 'Fair', 'Requires Attention'];
const deliveryOptionsList = [
  { id: 'farm_pickup', label: 'Farm Pickup', description: 'Buyer collects from your farm' },
  { id: 'local_delivery', label: 'Local Delivery', description: 'Within 50km radius' },
  { id: 'regional_delivery', label: 'Regional Delivery', description: 'Within your province' },
  { id: 'nationwide', label: 'Nationwide Shipping', description: 'Deliver anywhere in Zimbabwe' },
  { id: 'transport_arranged', label: 'Transport Can Be Arranged', description: 'Help buyer find transport' },
];
const paymentOptionsList = [
  { id: 'ecocash', label: 'EcoCash', icon: '📱' },
  { id: 'onemoney', label: 'OneMoney', icon: '📱' },
  { id: 'innbucks', label: 'InnBucks', icon: '📱' },
  { id: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
  { id: 'escrow', label: 'Escrow Payment', icon: '🔒' },
  { id: 'cash', label: 'Cash on Delivery', icon: '💵' },
];

export default function CreateListing() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const { addListing } = useAppData();
  const [category, setCategory] = useState<'crops' | 'livestock' | ''>('');
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  
  const [cropForm, setCropForm] = useState<Partial<CropListingData>>({
    category: 'crops',
    cropType: '',
    qualityGrade: '',
    pricePerKg: '',
    pricePerTon: '',
    availableQuantity: '',
    quantityUnit: 'kg',
    location: '',
    images: [],
    videoUrl: '',
    farmDescription: '',
    deliveryOptions: [],
    paymentOptions: [],
    title: '',
    readyToSell: false,
    deliveryTerms: '',
  });

  const [livestockForm, setLivestockForm] = useState<Partial<LivestockListingData>>({
    category: 'livestock',
    animalType: '',
    breed: '',
    age: '',
    sex: 'male',
    weight: '',
    healthStatus: '',
    vaccinationRecord: '',
    pricePerAnimal: '',
    numberOfAnimals: '',
    location: '',
    images: [],
    videoUrl: '',
    farmDescription: '',
    deliveryOptions: [],
    paymentOptions: [],
    title: '',
    readyToSell: false,
    deliveryTerms: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImagesChange = (images: UploadedImage[]) => {
    setUploadedImages(images);
    const imageUrls = images.map(img => img.url);
    
    if (category === 'crops') {
      setCropForm({ ...cropForm, images: imageUrls });
    } else if (category === 'livestock') {
      setLivestockForm({ ...livestockForm, images: imageUrls });
    }
  };

  const validateForm = () => {
    if (uploadedImages.length === 0) {
      showToast('error', 'Please upload at least one product image');
      return false;
    }

    if (category === 'crops') {
      if (!cropForm.title || !cropForm.cropType || !cropForm.pricePerKg || !cropForm.availableQuantity) {
        showToast('error', 'Please fill in all required fields');
        return false;
      }
      if (cropForm.readyToSell && !cropForm.deliveryTerms) {
        showToast('error', 'Please specify delivery terms when Ready to Sell is enabled');
        return false;
      }
    } else if (category === 'livestock') {
      if (!livestockForm.title || !livestockForm.animalType || !livestockForm.pricePerAnimal || !livestockForm.numberOfAnimals) {
        showToast('error', 'Please fill in all required fields');
        return false;
      }
      if (livestockForm.readyToSell && !livestockForm.deliveryTerms) {
        showToast('error', 'Please specify delivery terms when Ready to Sell is enabled');
        return false;
      }
    }
    
    return true;
  };

  const toggleOption = (type: 'delivery' | 'payment', option: string) => {
    if (category === 'crops') {
      const field = type === 'delivery' ? 'deliveryOptions' : 'paymentOptions';
      const current = cropForm[field] || [];
      const updated = current.includes(option)
        ? current.filter(o => o !== option)
        : [...current, option];
      setCropForm({ ...cropForm, [field]: updated });
    } else {
      const field = type === 'delivery' ? 'deliveryOptions' : 'paymentOptions';
      const current = livestockForm[field] || [];
      const updated = current.includes(option)
        ? current.filter(o => o !== option)
        : [...current, option];
      setLivestockForm({ ...livestockForm, [field]: updated });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (uploadedImages.length === 0) {
      showToast('error', 'Please add at least one image');
      return;
    }
    
    const form = category === 'crops' ? cropForm : livestockForm;
    if (!form.title?.trim() || !form.location) {
      showToast('error', 'Please fill in all required fields');
      return;
    }
    
    if (form.deliveryOptions?.length === 0) {
      showToast('error', 'Please select at least one delivery option');
      return;
    }
    
    if (form.paymentOptions?.length === 0) {
      showToast('error', 'Please select at least one payment option');
      return;
    }
    
    // If Ready to Sell is enabled, ensure delivery terms are provided
    if (form.readyToSell && (!form.deliveryTerms || form.deliveryTerms.trim() === '')) {
      showToast('error', 'Please provide delivery terms for direct purchase');
      return;
    }

    setIsSubmitting(true);
    try {
      const price = category === 'crops'
        ? Number(cropForm.pricePerKg) || 0
        : Number(livestockForm.pricePerAnimal) || 0;
      const quantity = category === 'crops'
        ? Number(cropForm.availableQuantity) || 0
        : Number(livestockForm.numberOfAnimals) || 0;
      const unit = category === 'crops'
        ? (cropForm.quantityUnit || 'kg')
        : 'each';
      const subcategory = category === 'crops'
        ? (cropForm.cropType || '')
        : (livestockForm.animalType || '');

      if (isSupabaseReady() && user) {
        await listingService.create({
          seller_id: user.id,
          title: form.title || '',
          description: form.farmDescription || '',
          category,
          subcategory,
          price,
          unit,
          quantity,
          location: form.location || '',
          images: form.images || [],
          ready_to_sell: form.readyToSell || false,
          delivery_terms: form.deliveryTerms || '',
          delivery_options: form.deliveryOptions || [],
          payment_options: form.paymentOptions || [],
          organic: false,
          tags: [],
        });
      } else {
        addListing({
          sellerId: user?.id || '',
          sellerName: user?.name || '',
          sellerAvatar: user?.avatar || '',
          sellerRating: 0,
          sellerVerified: user?.verified || false,
          sellerLocation: user?.location || '',
          title: form.title || '',
          description: form.farmDescription || '',
          category,
          subcategory,
          price,
          unit,
          quantity,
          location: form.location || '',
          images: form.images || [],
          status: 'active',
          featured: false,
          views: 0,
          organic: false,
          tags: [],
          readyToSell: form.readyToSell || false,
          deliveryTerms: form.deliveryTerms || '',
          deliveryOptions: form.deliveryOptions || [],
          paymentOptions: form.paymentOptions || [],
          createdAt: new Date().toISOString(),
        } as any);
      }
      showToast('success', 'Listing created successfully!');
      navigate('/my-listings');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to create listing. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!category) {
    return (
      <div className="create-listing-page">
        <div className="create-listing-header">
          <button className="btn-back" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
            Back
          </button>
          <h1>Create New Listing</h1>
        </div>

        <div className="create-listing-content">
          <div className="category-selection-page">
            <h2>What are you listing?</h2>
            <p>Choose the type of product you want to sell</p>
            
            <div className="listing-type-cards">
              <button
                className="listing-type-card crops"
                onClick={() => setCategory('crops')}
              >
                <span className="type-icon">🌾</span>
                <h3>Crops</h3>
                <p>Maize, Tomatoes, Potatoes, Vegetables, Fruits, etc.</p>
                <span className="arrow">→</span>
              </button>
              
              <button
                className="listing-type-card livestock"
                onClick={() => setCategory('livestock')}
              >
                <span className="type-icon">🐄</span>
                <h3>Livestock</h3>
                <p>Cattle, Goats, Sheep, Pigs, Chickens, etc.</p>
                <span className="arrow">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-listing-page">
      <div className="create-listing-header">
        <button className="btn-back" onClick={() => setCategory('')}>
          <ArrowLeft size={20} />
          Back to Category
        </button>
        <h1>Create {category === 'crops' ? 'Crop' : 'Livestock'} Listing</h1>
      </div>

      <div className="create-listing-content">
        <form onSubmit={handleSubmit} className="listing-form">
          
          {/* CROP LISTING FORM */}
          {category === 'crops' && (
            <>
              <div className="form-section">
                <h3>Basic Information</h3>

                <div className="form-group">
                  <label>Listing Title *</label>
                  <input
                    type="text"
                    placeholder="e.g., Fresh Grade-A Maize — Harare Farm"
                    value={cropForm.title}
                    onChange={(e) => setCropForm({ ...cropForm, title: e.target.value })}
                    maxLength={100}
                    required
                  />
                  <span className="form-hint">A clear title helps buyers find your listing faster</span>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    placeholder="Describe your crop: growing method, harvest date, storage conditions, etc."
                    value={cropForm.farmDescription}
                    onChange={(e) => setCropForm({ ...cropForm, farmDescription: e.target.value })}
                    rows={3}
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Crop Type *</label>
                    <select
                      value={cropForm.cropType}
                      onChange={(e) => setCropForm({ ...cropForm, cropType: e.target.value })}
                      required
                    >
                      <option value="">Select crop type</option>
                      {cropTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Quality Grade *</label>
                    <select
                      value={cropForm.qualityGrade}
                      onChange={(e) => setCropForm({ ...cropForm, qualityGrade: e.target.value })}
                      required
                    >
                      <option value="">Select quality grade</option>
                      {qualityGrades.map(grade => (
                        <option key={grade} value={grade}>{grade}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Pricing & Quantity</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>
                      <DollarSign size={18} />
                      Price per KG *
                    </label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={cropForm.pricePerKg}
                      onChange={(e) => setCropForm({ ...cropForm, pricePerKg: e.target.value })}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <DollarSign size={18} />
                      Price per Ton
                    </label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={cropForm.pricePerTon}
                      onChange={(e) => setCropForm({ ...cropForm, pricePerTon: e.target.value })}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>
                      <Package size={18} />
                      Available Quantity *
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 100"
                      value={cropForm.availableQuantity}
                      onChange={(e) => setCropForm({ ...cropForm, availableQuantity: e.target.value })}
                      min="1"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Unit *</label>
                    <select
                      value={cropForm.quantityUnit}
                      onChange={(e) => setCropForm({ ...cropForm, quantityUnit: e.target.value as 'kg' | 'tonnes' })}
                    >
                      <option value="kg">Kilograms (kg)</option>
                      <option value="tonnes">Tonnes</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Location</h3>
                
                <div className="form-group">
                  <label>
                    <MapPin size={18} />
                    Location *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Harare, Zimbabwe"
                    value={cropForm.location}
                    onChange={(e) => setCropForm({ ...cropForm, location: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="form-section">
                <h3>Ready to Sell Status</h3>
                <p className="section-hint">Enable direct purchase without buyer-seller chat</p>
                <div className={`ready-to-sell-toggle ${cropForm.readyToSell ? 'active' : ''}`}>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={cropForm.readyToSell}
                      onChange={(e) => setCropForm({ ...cropForm, readyToSell: e.target.checked })}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  <div className="toggle-label">
                    <strong>Ready to Sell</strong>
                    <p className="toggle-description">
                      {cropForm.readyToSell ? 
                        "Buyers can purchase directly without contacting you first." : 
                        "Buyers must contact you before purchasing."}
                    </p>
                  </div>
                </div>

                {cropForm.readyToSell && (
                  <div className="form-group">
                    <label>Delivery Terms *</label>
                    <textarea
                      placeholder="Describe your delivery terms clearly (e.g., delivery time, minimum order, etc.)"
                      value={cropForm.deliveryTerms}
                      onChange={(e) => setCropForm({ ...cropForm, deliveryTerms: e.target.value })}
                      rows={3}
                      required={cropForm.readyToSell}
                    />
                    <span className="form-hint">Clear terms help buyers make quick decisions</span>
                  </div>
                )}
              </div>

              <div className="form-section">
                <h3>Photos & Video</h3>
                
                <ImageUpload
                  maxImages={10}
                  maxSizeMB={5}
                  onImagesChange={handleImagesChange}
                  initialImages={uploadedImages}
                />

                <div className="form-group">
                  <label>
                    <Video size={18} />
                    Video URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://youtube.com/watch?v=..."
                    value={cropForm.videoUrl}
                    onChange={(e) => setCropForm({ ...cropForm, videoUrl: e.target.value })}
                  />
                  <span className="form-hint">Add a YouTube or Vimeo video link</span>
                </div>
              </div>

              <div className="form-section">
                <h3>Delivery Options *</h3>
                <p className="section-hint">Select all delivery methods you offer</p>
                <div className="delivery-options-grid">
                  {deliveryOptionsList.map(option => (
                    <label key={option.id} className={`delivery-option-card ${cropForm.deliveryOptions?.includes(option.id) ? 'selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={cropForm.deliveryOptions?.includes(option.id)}
                        onChange={() => toggleOption('delivery', option.id)}
                      />
                      <div className="delivery-option-content">
                        <Truck size={20} />
                        <div className="delivery-option-text">
                          <span className="delivery-option-label">{option.label}</span>
                          <span className="delivery-option-desc">{option.description}</span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-section">
                <h3>Payment Options *</h3>
                <p className="section-hint">Select payment methods you accept</p>
                <div className="payment-options-grid">
                  {paymentOptionsList.map(option => (
                    <label key={option.id} className={`payment-option-card ${cropForm.paymentOptions?.includes(option.id) ? 'selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={cropForm.paymentOptions?.includes(option.id)}
                        onChange={() => toggleOption('payment', option.id)}
                      />
                      <span className="payment-icon">{option.icon}</span>
                      <span className="payment-label">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* LIVESTOCK LISTING FORM */}
          {category === 'livestock' && (
            <>
              <div className="form-section">
                <h3>Basic Information</h3>

                <div className="form-group">
                  <label>Listing Title *</label>
                  <input
                    type="text"
                    placeholder="e.g., 5 Healthy Boer Goats — Bulawayo"
                    value={livestockForm.title}
                    onChange={(e) => setLivestockForm({ ...livestockForm, title: e.target.value })}
                    maxLength={100}
                    required
                  />
                  <span className="form-hint">A clear title helps buyers find your listing faster</span>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    placeholder="Describe your animals: feeding history, purpose (dairy/beef/breeding), any certifications, etc."
                    value={livestockForm.farmDescription}
                    onChange={(e) => setLivestockForm({ ...livestockForm, farmDescription: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Animal Type *</label>
                    <select
                      value={livestockForm.animalType}
                      onChange={(e) => setLivestockForm({ ...livestockForm, animalType: e.target.value })}
                      required
                    >
                      <option value="">Select animal type</option>
                      {animalTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Breed *</label>
                    <input
                      type="text"
                      placeholder="e.g., Holstein, Boer, etc."
                      value={livestockForm.breed}
                      onChange={(e) => setLivestockForm({ ...livestockForm, breed: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Age *</label>
                    <input
                      type="text"
                      placeholder="e.g., 2 years, 6 months"
                      value={livestockForm.age}
                      onChange={(e) => setLivestockForm({ ...livestockForm, age: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Sex *</label>
                    <select
                      value={livestockForm.sex}
                      onChange={(e) => setLivestockForm({ ...livestockForm, sex: e.target.value as any })}
                      required
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="mixed">Mixed</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Weight (kg) *</label>
                  <input
                    type="text"
                    placeholder="e.g., 450 or 400-500 (estimated)"
                    value={livestockForm.weight}
                    onChange={(e) => setLivestockForm({ ...livestockForm, weight: e.target.value })}
                    required
                  />
                  <span className="form-hint">Enter actual or estimated weight</span>
                </div>
              </div>

              <div className="form-section">
                <h3>Health Information</h3>
                
                <div className="form-group">
                  <label>Health Status *</label>
                  <select
                    value={livestockForm.healthStatus}
                    onChange={(e) => setLivestockForm({ ...livestockForm, healthStatus: e.target.value })}
                    required
                  >
                    <option value="">Select health status</option>
                    {healthStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-section">
                <h3>Pricing & Quantity</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>
                      <DollarSign size={18} />
                      Price per Animal *
                    </label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={livestockForm.pricePerAnimal}
                      onChange={(e) => setLivestockForm({ ...livestockForm, pricePerAnimal: e.target.value })}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <Package size={18} />
                      Number of Animals *
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 5"
                      value={livestockForm.numberOfAnimals}
                      onChange={(e) => setLivestockForm({ ...livestockForm, numberOfAnimals: e.target.value })}
                      min="1"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Location</h3>
                
                <div className="form-group">
                  <label>
                    <MapPin size={18} />
                    Location *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Bulawayo, Zimbabwe"
                    value={livestockForm.location}
                    onChange={(e) => setLivestockForm({ ...livestockForm, location: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="form-section">
                <h3>Ready to Sell Status</h3>
                <p className="section-hint">Enable direct purchase without buyer-seller chat</p>
                <div className={`ready-to-sell-toggle ${livestockForm.readyToSell ? 'active' : ''}`}>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={livestockForm.readyToSell}
                      onChange={(e) => setLivestockForm({ ...livestockForm, readyToSell: e.target.checked })}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  <div className="toggle-label">
                    <strong>Ready to Sell</strong>
                    <p className="toggle-description">
                      {livestockForm.readyToSell ? 
                        "Buyers can purchase directly without contacting you first." : 
                        "Buyers must contact you before purchasing."}
                    </p>
                  </div>
                </div>

                {livestockForm.readyToSell && (
                  <div className="form-group">
                    <label>Delivery Terms *</label>
                    <textarea
                      placeholder="Describe your delivery terms clearly (e.g., delivery time, animal handling, etc.)"
                      value={livestockForm.deliveryTerms}
                      onChange={(e) => setLivestockForm({ ...livestockForm, deliveryTerms: e.target.value })}
                      rows={3}
                      required={livestockForm.readyToSell}
                    />
                    <span className="form-hint">Clear terms help buyers make quick decisions</span>
                  </div>
                )}
              </div>

              <div className="form-section">
                <h3>Photos & Video</h3>
                
                <ImageUpload
                  maxImages={10}
                  maxSizeMB={5}
                  onImagesChange={handleImagesChange}
                  initialImages={uploadedImages}
                />

                <div className="form-group">
                  <label>
                    <Video size={18} />
                    Video URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://youtube.com/watch?v=..."
                    value={livestockForm.videoUrl}
                    onChange={(e) => setLivestockForm({ ...livestockForm, videoUrl: e.target.value })}
                  />
                  <span className="form-hint">Add a YouTube or Vimeo video link</span>
                </div>
              </div>

              <div className="form-section">
                <h3>Delivery Options *</h3>
                <p className="section-hint">Select all delivery methods you offer</p>
                <div className="delivery-options-grid">
                  {deliveryOptionsList.map(option => (
                    <label key={option.id} className={`delivery-option-card ${livestockForm.deliveryOptions?.includes(option.id) ? 'selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={livestockForm.deliveryOptions?.includes(option.id)}
                        onChange={() => toggleOption('delivery', option.id)}
                      />
                      <div className="delivery-option-content">
                        <Truck size={20} />
                        <div className="delivery-option-text">
                          <span className="delivery-option-label">{option.label}</span>
                          <span className="delivery-option-desc">{option.description}</span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-section">
                <h3>Payment Options *</h3>
                <p className="section-hint">Select payment methods you accept</p>
                <div className="payment-options-grid">
                  {paymentOptionsList.map(option => (
                    <label key={option.id} className={`payment-option-card ${livestockForm.paymentOptions?.includes(option.id) ? 'selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={livestockForm.paymentOptions?.includes(option.id)}
                        onChange={() => toggleOption('payment', option.id)}
                      />
                      <span className="payment-icon">{option.icon}</span>
                      <span className="payment-label">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setCategory('')}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting || uploadedImages.length === 0}>
              {isSubmitting ? (
                <>
                  <span className="spinner"></span>
                  Creating Listing...
                </>
              ) : (
                <>
                  <Check size={18} />
                  Create Listing
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
