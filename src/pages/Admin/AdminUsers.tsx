import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/UI/Toast';
import {
  Search,
  Download,
  ChevronDown,
  Eye,
  Ban,
  CheckCircle,
  MoreVertical,
  Users,
  UserCheck,
  UserX,
  Mail,
  MapPin,
  Calendar,
} from 'lucide-react';
import { isSupabaseReady } from '../../lib/supabase';
import { adminService } from '../../services/supabase/adminService';
import { mockUsers } from '../../data/mockData';

// Extended mock users for admin view
const fallbackUsers = [
  ...mockUsers,
  {
    id: 'farmer-2',
    name: 'Grace Mutasa',
    email: 'grace@farm.zw',
    phone: '+263 77 234 5678',
    role: 'farmer' as const,
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    location: 'Chitungwiza, Zimbabwe',
    verified: true,
    createdAt: '2024-02-10',
  },
  {
    id: 'buyer-2',
    name: 'Michael Tawanda',
    email: 'michael@buyer.zw',
    phone: '+263 78 345 6789',
    role: 'buyer' as const,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    location: 'Harare, Zimbabwe',
    verified: true,
    createdAt: '2024-03-05',
  },
  {
    id: 'farmer-3',
    name: 'Tendai Zimuto',
    email: 'tendai@farm.zw',
    phone: '+263 71 456 7890',
    role: 'farmer' as const,
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
    location: 'Masvingo, Zimbabwe',
    verified: false,
    createdAt: '2024-04-15',
  },
  {
    id: 'transporter-2',
    name: 'David Sibanda',
    email: 'david@transport.zw',
    phone: '+263 77 567 8901',
    role: 'transporter' as const,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    location: 'Bulawayo, Zimbabwe',
    verified: true,
    createdAt: '2024-05-20',
  },
];

export default function AdminUsers() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [userToVerify, setUserToVerify] = useState<typeof fallbackUsers[0] | null>(null);
  const [users, setUsers] = useState(fallbackUsers);

  useEffect(() => {
    if (isSupabaseReady()) {
      adminService.getAllUsers().then((dbUsers) => {
        if (dbUsers.length > 0) {
          setUsers(dbUsers.map((u: any) => ({
            id: u.id,
            name: u.name || 'Unknown',
            email: u.email || '',
            phone: u.phone || '',
            role: u.role || 'buyer',
            avatar: u.avatar || '',
            location: u.location || '',
            verified: u.verified || false,
            createdAt: u.created_at?.split('T')[0] || '',
          })));
        }
      }).catch(() => {});
    }
  }, []);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone.includes(searchQuery);
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'verified' && user.verified) ||
      (statusFilter === 'unverified' && !user.verified);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const stats = {
    total: users.length,
    farmers: users.filter((u) => u.role === 'farmer').length,
    buyers: users.filter((u) => u.role === 'buyer').length,
    transporters: users.filter((u) => u.role === 'transporter').length,
    verified: users.filter((u) => u.verified).length,
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleViewProfile = (userId: string) => {
    navigate('/profile', { state: { viewUserId: userId } });
  };

  const handleVerifyUser = (user: typeof fallbackUsers[0]) => {
    setUserToVerify(user);
    setShowVerifyModal(true);
  };

  const confirmVerification = () => {
    if (userToVerify) {
      setUsers(prev => prev.map(u => 
        u.id === userToVerify.id ? { ...u, verified: true } : u
      ));
      showToast('success', `${userToVerify.name} has been verified!`);
    }
    setShowVerifyModal(false);
    setUserToVerify(null);
  };

  const handleBulkVerify = () => {
    setUsers(prev => prev.map(u => 
      selectedUsers.includes(u.id) ? { ...u, verified: true } : u
    ));
    showToast('success', `${selectedUsers.length} users have been verified!`);
    setSelectedUsers([]);
  };

  const handleBulkSuspend = () => {
    showToast('warning', `${selectedUsers.length} users have been suspended`);
    setSelectedUsers([]);
  };

  const handleBanUser = (userName: string) => {
    showToast('warning', `${userName} has been banned`);
  };

  const handleExportUsers = () => {
    showToast('info', 'Exporting user data...');
    setTimeout(() => {
      showToast('success', 'User data exported successfully!');
    }, 1500);
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>User Management</h1>
          <p>Manage all users on the platform</p>
        </div>
        <button className="btn-secondary" onClick={handleExportUsers}>
          <Download size={18} /> Export Users
        </button>
      </div>

      {/* Stats */}
      <div className="user-stats-grid">
        <div className="user-stat-card">
          <Users size={24} />
          <div>
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Users</span>
          </div>
        </div>
        <div className="user-stat-card farmer">
          <span className="role-emoji">👨‍🌾</span>
          <div>
            <span className="stat-value">{stats.farmers}</span>
            <span className="stat-label">Farmers</span>
          </div>
        </div>
        <div className="user-stat-card buyer">
          <span className="role-emoji">🛒</span>
          <div>
            <span className="stat-value">{stats.buyers}</span>
            <span className="stat-label">Buyers</span>
          </div>
        </div>
        <div className="user-stat-card transporter">
          <span className="role-emoji">🚚</span>
          <div>
            <span className="stat-value">{stats.transporters}</span>
            <span className="stat-label">Transporters</span>
          </div>
        </div>
        <div className="user-stat-card verified">
          <UserCheck size={24} />
          <div>
            <span className="stat-value">{stats.verified}</span>
            <span className="stat-label">Verified</span>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="bulk-actions-bar">
          <span>{selectedUsers.length} user(s) selected</span>
          <div className="bulk-actions">
            <button className="btn-bulk verify" onClick={handleBulkVerify}>
              <CheckCircle size={16} />
              Verify Selected
            </button>
            <button className="btn-bulk suspend" onClick={handleBulkSuspend}>
              <Ban size={16} />
              Suspend Selected
            </button>
            <button className="btn-bulk cancel" onClick={() => setSelectedUsers([])}>
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
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Role</label>
          <div className="select-wrapper">
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="all">All Roles</option>
              <option value="farmer">Farmers</option>
              <option value="buyer">Buyers</option>
              <option value="transporter">Transporters</option>
            </select>
            <ChevronDown size={16} />
          </div>
        </div>

        <div className="filter-group">
          <label>Status</label>
          <div className="select-wrapper">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>
            <ChevronDown size={16} />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="admin-table-container">
        <table className="admin-table users-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th>User</th>
              <th>Role</th>
              <th>Contact</th>
              <th>Location</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className={selectedUsers.includes(user.id) ? 'selected' : ''}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => handleSelectUser(user.id)}
                  />
                </td>
                <td>
                  <div className="user-info-cell">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="user-avatar" />
                    ) : (
                      <div className="avatar-placeholder">
                        {user.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <span className="user-name">{user.name}</span>
                      <span className="user-id">{user.id}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`role-badge ${user.role}`}>
                    {user.role === 'farmer' && '👨‍🌾'}
                    {user.role === 'buyer' && '🛒'}
                    {user.role === 'transporter' && '🚚'}
                    {user.role}
                  </span>
                </td>
                <td>
                  <div className="contact-cell">
                    <span className="email">
                      <Mail size={14} /> {user.email}
                    </span>
                    <span className="phone">{user.phone}</span>
                  </div>
                </td>
                <td>
                  <span className="location-cell">
                    <MapPin size={14} /> {user.location}
                  </span>
                </td>
                <td>
                  {user.verified ? (
                    <span className="status-badge status-verified">
                      <CheckCircle size={14} /> Verified
                    </span>
                  ) : (
                    <span className="status-badge status-unverified">
                      <UserX size={14} /> Unverified
                    </span>
                  )}
                </td>
                <td>
                  <span className="date-cell">
                    <Calendar size={14} />
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn-icon" 
                      title="View Profile"
                      onClick={() => handleViewProfile(user.id)}
                    >
                      <Eye size={18} />
                    </button>
                    {!user.verified && (
                      <button
                        className="btn-icon verify"
                        title="Verify User"
                        onClick={() => handleVerifyUser(user)}
                      >
                        <CheckCircle size={18} />
                      </button>
                    )}
                    <button 
                      className="btn-icon ban" 
                      title="Ban User"
                      onClick={() => handleBanUser(user.name)}
                    >
                      <Ban size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="empty-state">
            <Users size={48} />
            <h3>No users found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Verification Modal */}
      {showVerifyModal && userToVerify && (
        <div className="modal-overlay" onClick={() => setShowVerifyModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Verify User</h2>
            <div className="verify-user-info">
              <img
                src={userToVerify.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userToVerify.name)}&background=0a6b2b&color=fff&size=80`}
                alt={userToVerify.name}
                className="verify-avatar"
              />
              <div>
                <h3>{userToVerify.name}</h3>
                <p>{userToVerify.email}</p>
                <p>{userToVerify.phone}</p>
                <span className={`role-badge ${userToVerify.role}`}>
                  {userToVerify.role}
                </span>
              </div>
            </div>
            <div className="verification-checklist">
              <h4>Verification Checklist</h4>
              <label>
                <input type="checkbox" />
                Phone number verified
              </label>
              <label>
                <input type="checkbox" />
                Email verified
              </label>
              <label>
                <input type="checkbox" />
                ID documents uploaded
              </label>
              <label>
                <input type="checkbox" />
                Business registration (if farmer)
              </label>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowVerifyModal(false)}>
                Cancel
              </button>
              <button className="btn-verify" onClick={confirmVerification}>
                <CheckCircle size={18} />
                Verify User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
