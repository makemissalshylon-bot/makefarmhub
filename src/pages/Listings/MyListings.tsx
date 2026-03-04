import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Package,
  CheckCircle,
  Clock,
  XCircle,
  MessageSquare,
  DollarSign,
  TrendingUp,
  BarChart,
} from 'lucide-react';

type FilterStatus = 'all' | 'active' | 'reserved' | 'sold' | 'draft';

export default function MyListings() {
  const { user } = useAuth();
  const { listings } = useAppData();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<string | null>(null);
  const [showOffersModal, setShowOffersModal] = useState(false);
  const [selectedListingOffers, setSelectedListingOffers] = useState<any>(null);

  // Filter listings for current user
  const myListings = listings.filter((l) => l.sellerId === user?.id);

  const filteredListings = myListings.filter((listing) => {
    const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || listing.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: myListings.length,
    active: myListings.filter((l) => l.status === 'active').length,
    reserved: myListings.filter((l) => l.status === 'reserved').length,
    sold: myListings.filter((l) => l.status === 'sold').length,
    draft: myListings.filter((l) => l.status === 'draft').length,
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle size={14} />;
      case 'reserved':
        return <Clock size={14} />;
      case 'sold':
        return <Package size={14} />;
      case 'draft':
        return <XCircle size={14} />;
      default:
        return null;
    }
  };

  const handleMarkAsSold = (listingId: string) => {
    alert('Listing marked as sold!');
    setActiveMenu(null);
  };

  const confirmDelete = (listingId: string) => {
    setListingToDelete(listingId);
    setShowDeleteModal(true);
    setActiveMenu(null);
  };

  const handleDelete = () => {
    alert('Listing deleted successfully!');
    setShowDeleteModal(false);
    setListingToDelete(null);
  };

  const viewOffers = (listing: any) => {
    setSelectedListingOffers({
      listing,
      offers: [
        { id: '1', buyerName: 'John Doe', amount: listing.price * 0.9, message: 'Can you do $' + (listing.price * 0.9) + '?', status: 'pending' },
        { id: '2', buyerName: 'Jane Smith', amount: listing.price * 0.95, message: 'Interested in bulk purchase', status: 'pending' },
      ]
    });
    setShowOffersModal(true);
    setActiveMenu(null);
  };

  const handleOffer = (offerId: string, action: 'accept' | 'reject') => {
    alert(`Offer ${action}ed!`);
  };

  return (
    <div className="my-listings-page">
      <div className="page-header">
        <div>
          <h1>My Listings</h1>
          <p>Manage your products and track performance</p>
        </div>
        <Link to="/create-listing" className="btn-primary">
          <Plus size={20} />
          New Listing
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="listings-stats">
        <div className="stat-card">
          <Package size={24} />
          <div>
            <span className="stat-value">{statusCounts.all}</span>
            <span className="stat-label">Total Listings</span>
          </div>
        </div>
        <div className="stat-card active">
          <CheckCircle size={24} />
          <div>
            <span className="stat-value">{statusCounts.active}</span>
            <span className="stat-label">Active</span>
          </div>
        </div>
        <div className="stat-card reserved">
          <Clock size={24} />
          <div>
            <span className="stat-value">{statusCounts.reserved}</span>
            <span className="stat-label">Reserved</span>
          </div>
        </div>
        <div className="stat-card sold">
          <Package size={24} />
          <div>
            <span className="stat-value">{statusCounts.sold}</span>
            <span className="stat-label">Sold</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="listings-filters">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search listings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="status-tabs">
          {(['all', 'active', 'reserved', 'sold', 'draft'] as FilterStatus[]).map((status) => (
            <button
              key={status}
              className={`status-tab ${filterStatus === status ? 'active' : ''}`}
              onClick={() => setFilterStatus(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              <span className="count">{statusCounts[status]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Listings Table */}
      <div className="listings-table-container">
        {filteredListings.length > 0 ? (
          <table className="listings-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Views</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredListings.map((listing) => (
                <tr key={listing.id}>
                  <td className="product-cell">
                    <img src={listing.images[0]} alt={listing.title} />
                    <div>
                      <Link to={`/listing/${listing.id}`}>{listing.title}</Link>
                      <span>{listing.createdAt}</span>
                    </div>
                  </td>
                  <td>
                    <span className="category-badge">{listing.subcategory}</span>
                  </td>
                  <td className="price-cell">
                    ${listing.price}/{listing.unit}
                  </td>
                  <td>
                    {listing.quantity} {listing.unit}s
                  </td>
                  <td>
                    <span className="views-cell">
                      <Eye size={14} /> {listing.views}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-${listing.status}`}>
                      {getStatusIcon(listing.status)}
                      {listing.status}
                    </span>
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button
                        className="action-menu-btn"
                        onClick={() => setActiveMenu(activeMenu === listing.id ? null : listing.id)}
                      >
                        <MoreVertical size={18} />
                      </button>
                      {activeMenu === listing.id && (
                        <div className="action-menu">
                          <Link to={`/listing/${listing.id}`}>
                            <Eye size={16} /> View Details
                          </Link>
                          <Link to={`/create-listing`}>
                            <Edit size={16} /> Edit Listing
                          </Link>
                          {listing.status === 'active' && (
                            <button onClick={() => handleMarkAsSold(listing.id)}>
                              <CheckCircle size={16} /> Mark as Sold
                            </button>
                          )}
                          <button onClick={() => viewOffers(listing)}>
                            <DollarSign size={16} /> View Offers (2)
                          </button>
                          <Link to={`/messages`}>
                            <MessageSquare size={16} /> Messages
                          </Link>
                          <button onClick={() => {}}>
                            <BarChart size={16} /> Analytics
                          </button>
                          <button className="delete" onClick={() => confirmDelete(listing.id)}>
                            <Trash2 size={16} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <Package size={48} />
            <h3>No listings found</h3>
            <p>
              {searchQuery || filterStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : "You haven't created any listings yet"}
            </p>
            <Link to="/create-listing" className="btn-primary">
              <Plus size={20} />
              Create your first listing
            </Link>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Delete Listing</h2>
            <p>Are you sure you want to delete this listing? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button className="btn-delete" onClick={handleDelete}>
                <Trash2 size={18} />
                Delete Listing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offers Modal */}
      {showOffersModal && selectedListingOffers && (
        <div className="modal-overlay" onClick={() => setShowOffersModal(false)}>
          <div className="modal-content offers-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Offers for {selectedListingOffers.listing.title}</h2>
              <button className="close-btn" onClick={() => setShowOffersModal(false)}>
                <XCircle size={20} />
              </button>
            </div>
            
            <div className="offers-list">
              {selectedListingOffers.offers.map((offer: any) => (
                <div key={offer.id} className="offer-card">
                  <div className="offer-header">
                    <div>
                      <h4>{offer.buyerName}</h4>
                      <p className="offer-amount">${offer.amount.toFixed(2)}</p>
                    </div>
                    <span className={`offer-status ${offer.status}`}>{offer.status}</span>
                  </div>
                  <p className="offer-message">{offer.message}</p>
                  {offer.status === 'pending' && (
                    <div className="offer-actions">
                      <button className="btn-accept" onClick={() => handleOffer(offer.id, 'accept')}>
                        <CheckCircle size={16} />
                        Accept Offer
                      </button>
                      <button className="btn-reject" onClick={() => handleOffer(offer.id, 'reject')}>
                        <XCircle size={16} />
                        Reject
                      </button>
                      <Link to={`/messages`} className="btn-message">
                        <MessageSquare size={16} />
                        Message Buyer
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
