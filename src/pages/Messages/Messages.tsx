import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../components/UI/Toast';
import { useRealtimeChat, useRealtimeStatus } from '../../hooks/useRealtime';
import {
  Search,
  Send,
  Image,
  MapPin,
  MoreVertical,
  Phone,
  Video,
  ArrowLeft,
  Check,
  CheckCheck,
  X,
  Navigation,
  PhoneCall,
  VideoIcon,
} from 'lucide-react';

export default function Messages() {
  const { user } = useAuth();
  const location = useLocation();
  const { conversations, messages, sendMessage } = useAppData();
  const { showToast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{lat: number; lng: number; address: string} | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [showCallModal, setShowCallModal] = useState<'phone' | 'video' | null>(null);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const { status: rtStatus, connect: rtConnect } = useRealtimeStatus();
  const { typingUsers, startTyping, stopTyping } = useRealtimeChat(selectedConversation || '');
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Connect to realtime service on mount
  useEffect(() => {
    if (user?.id && rtStatus === 'disconnected') {
      rtConnect(user.id);
    }
  }, [user?.id, rtStatus, rtConnect]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!user?.id) return;
    startTyping(user.id);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(user.id);
    }, 2000);
  }, [user?.id, startTyping, stopTyping]);
  
  // Handle navigation from listing pages
  useEffect(() => {
    const state = location.state as any;
    if (state?.sellerId && state?.sellerName) {
      // Find or create conversation with this seller
      const existingConv = conversations.find(c => 
        c.participants.some(p => p.id === state.sellerId)
      );
      
      if (existingConv) {
        setSelectedConversation(existingConv.id);
        showToast('info', `Chat opened with ${state.sellerName}`);
      } else {
        // Create new conversation context (UI only for demo)
        showToast('info', `Starting new chat with ${state.sellerName}`);
        // In a real app, you'd create a new conversation here
        if (conversations.length > 0) {
          setSelectedConversation(conversations[0].id);
        }
      }
      // Clear the state
      window.history.replaceState({}, document.title);
    }
  }, [location.state, conversations, showToast]);

  const currentMessages = selectedConversation ? messages[selectedConversation] || [] : [];

  const selectedConv = conversations.find((c) => c.id === selectedConversation);
  const otherParticipant = selectedConv?.participants.find((p) => p.id !== user?.id);

  const filteredConversations = conversations.filter((conv) => {
    const otherPerson = conv.participants.find((p) => p.id !== user?.id);
    return (
      otherPerson?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.listingTitle?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (currentMessages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentMessages]);
  
  // Auto-select first conversation if none selected
  useEffect(() => {
    if (!selectedConversation && conversations.length > 0) {
      setSelectedConversation(conversations[0].id);
    }
  }, [conversations, selectedConversation]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConversation) return;
    
    sendMessage(selectedConversation, messageInput.trim());
    setMessageInput('');
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('error', 'Image size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setShowImagePreview(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendImage = () => {
    if (selectedImage && selectedConversation) {
      // Send the actual image data URL as message content
      sendMessage(selectedConversation, selectedImage);
      showToast('success', 'Image sent successfully');
      setShowImagePreview(false);
      setSelectedImage(null);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      showToast('error', 'Geolocation is not supported by your browser');
      return;
    }

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Reverse geocode to get address
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const address = data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          
          setCurrentLocation({ lat: latitude, lng: longitude, address });
          setLoadingLocation(false);
        } catch (error) {
          // Fallback to coordinates if geocoding fails
          const address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          setCurrentLocation({ lat: latitude, lng: longitude, address });
          setLoadingLocation(false);
        }
      },
      (error) => {
        setLoadingLocation(false);
        showToast('error', 'Unable to retrieve your location');
        console.error('Geolocation error:', error);
      }
    );
  };

  const handleShareLocation = () => {
    if (selectedConversation && currentLocation) {
      const locationMessage = `📍 Location: ${currentLocation.address}\nCoordinates: ${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}\nMap: https://www.google.com/maps?q=${currentLocation.lat},${currentLocation.lng}`;
      sendMessage(selectedConversation, locationMessage);
      showToast('success', 'Location shared');
      setShowLocationModal(false);
      setCurrentLocation(null);
    }
  };

  const handleCall = (type: 'phone' | 'video') => {
    setShowCallModal(type);
    showToast('info', `Initiating ${type} call with ${otherParticipant?.name}...`);
    // Auto close after 3 seconds to simulate call attempt
    setTimeout(() => {
      setShowCallModal(null);
      showToast('warning', `${otherParticipant?.name} is currently unavailable`);
    }, 3000);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="messages-page">
      {/* Conversations List */}
      <div className={`conversations-panel ${selectedConversation ? 'hidden-mobile' : ''}`}>
        <div className="conversations-header">
          <h1>Messages</h1>
          <button className="btn-icon">
            <MoreVertical size={20} />
          </button>
        </div>

        <div className="conversations-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="conversations-list">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => {
              const other = conv.participants.find((p) => p.id !== user?.id);
              return (
                <button
                  key={conv.id}
                  className={`conversation-item ${selectedConversation === conv.id ? 'active' : ''} ${conv.unreadCount > 0 ? 'unread' : ''}`}
                  onClick={() => setSelectedConversation(conv.id)}
                >
                  <div className="conversation-avatar">
                    {other?.avatar ? (
                      <img src={other.avatar} alt={other.name} />
                    ) : (
                      <div className="avatar-placeholder">{other?.name.charAt(0)}</div>
                    )}
                    <span className={`role-indicator ${other?.role}`} />
                  </div>
                  <div className="conversation-content">
                    <div className="conversation-header">
                      <h4>{other?.name}</h4>
                      <span className="conversation-time">{formatDate(conv.lastMessageTime)}</span>
                    </div>
                    {conv.listingTitle && (
                      <span className="conversation-listing">Re: {conv.listingTitle}</span>
                    )}
                    <p className="conversation-preview">{conv.lastMessage}</p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="unread-badge">{conv.unreadCount}</span>
                  )}
                </button>
              );
            })
          ) : (
            <div className="empty-conversations">
              <p>No conversations found</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Panel */}
      <div className={`chat-panel ${selectedConversation ? 'active' : ''}`}>
        {selectedConversation ? (
          <>
            <div className="chat-header">
              <button
                className="btn-back-mobile"
                onClick={() => setSelectedConversation(null)}
              >
                <ArrowLeft size={20} />
              </button>
              <div className="chat-user">
                {otherParticipant?.avatar ? (
                  <img src={otherParticipant.avatar} alt={otherParticipant.name} />
                ) : (
                  <div className="avatar-placeholder">{otherParticipant?.name.charAt(0)}</div>
                )}
                <div>
                  <h3>{otherParticipant?.name}</h3>
                  <span className="user-status">
                    <span className={`status-dot ${rtStatus === 'connected' ? 'online' : 'offline'}`} />
                    {typingUsers.length > 0 ? 'Typing...' : rtStatus === 'connected' ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
              <div className="chat-actions">
                <button 
                  className="btn-icon"
                  onClick={() => handleCall('phone')}
                  title="Voice call"
                >
                  <Phone size={20} />
                </button>
                <button 
                  className="btn-icon"
                  onClick={() => handleCall('video')}
                  title="Video call"
                >
                  <Video size={20} />
                </button>
                <div style={{ position: 'relative' }}>
                  <button className="btn-icon" onClick={() => setShowChatMenu(!showChatMenu)}>
                    <MoreVertical size={20} />
                  </button>
                  {showChatMenu && (
                    <div className="chat-dropdown-menu">
                      <button onClick={() => { showToast('info', 'Viewing conversation info...'); setShowChatMenu(false); }}>
                        View Info
                      </button>
                      <button onClick={() => { showToast('info', 'Muting conversation...'); setShowChatMenu(false); }}>
                        Mute Conversation
                      </button>
                      <button onClick={() => { showToast('info', 'Searching messages...'); setShowChatMenu(false); }}>
                        Search Messages
                      </button>
                      <button onClick={() => { showToast('warning', 'Blocking user...'); setShowChatMenu(false); }}>
                        Block User
                      </button>
                      <button onClick={() => { showToast('error', 'Reporting conversation...'); setShowChatMenu(false); }} style={{ color: '#ef4444' }}>
                        Report
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {selectedConv?.listingTitle && (
              <div className="chat-context">
                <span>Discussing:</span>
                <strong>{selectedConv.listingTitle}</strong>
              </div>
            )}

            <div className="chat-messages">
              {currentMessages.map((message, index) => {
                const isOwn = message.senderId === user?.id || message.senderId === 'farmer-1' || message.senderId === 'current-user';
                const showDate =
                  index === 0 ||
                  formatDate(currentMessages[index - 1].timestamp) !== formatDate(message.timestamp);

                return (
                  <div key={message.id}>
                    {showDate && (
                      <div className="message-date-divider">
                        <span>{formatDate(message.timestamp)}</span>
                      </div>
                    )}
                    <div className={`message ${isOwn ? 'own' : 'other'}`}>
                      <div className="message-bubble">
                        {message.content.startsWith('data:image/') ? (
                          <div className="message-image">
                            <img src={message.content} alt="Shared image" />
                          </div>
                        ) : (
                          <p style={{ whiteSpace: 'pre-wrap' }}>{message.content}</p>
                        )}
                        <div className="message-meta">
                          <span className="message-time">{formatTime(message.timestamp)}</span>
                          {isOwn && (
                            <span className="message-status">
                              {message.read ? <CheckCheck size={14} /> : <Check size={14} />}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form className="chat-input" onSubmit={handleSendMessage}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                style={{ display: 'none' }}
              />
              <button 
                type="button" 
                className="btn-icon"
                onClick={() => fileInputRef.current?.click()}
                title="Send image"
              >
                <Image size={20} />
              </button>
              <button 
                type="button" 
                className="btn-icon"
                onClick={() => setShowLocationModal(true)}
                title="Share location"
              >
                <MapPin size={20} />
              </button>
              <input
                type="text"
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => { setMessageInput(e.target.value); handleTyping(); }}
              />
              <button type="submit" className="btn-send" disabled={!messageInput.trim()}>
                <Send size={20} />
              </button>
            </form>
          </>
        ) : (
          <div className="chat-placeholder">
            <div className="placeholder-content">
              <div className="placeholder-icon">💬</div>
              <h2>Select a conversation</h2>
              <p>Choose a conversation from the list to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {showImagePreview && selectedImage && (
        <div className="modal-overlay" onClick={() => setShowImagePreview(false)}>
          <div className="image-preview-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowImagePreview(false)}>
              <X size={24} />
            </button>
            <h3>Send Image</h3>
            <div className="image-preview">
              <img src={selectedImage} alt="Preview" />
            </div>
            <div className="modal-actions">
              <button 
                className="btn-cancel" 
                onClick={() => {
                  setShowImagePreview(false);
                  setSelectedImage(null);
                }}
              >
                Cancel
              </button>
              <button className="btn-send-image" onClick={handleSendImage}>
                <Send size={18} />
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Share Modal */}
      {showLocationModal && (
        <div className="modal-overlay" onClick={() => setShowLocationModal(false)}>
          <div className="location-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowLocationModal(false)}>
              <X size={24} />
            </button>
            <div className="location-icon">
              <Navigation size={48} />
            </div>
            <h3>Share Your Location</h3>
            <p>Share your current location with {otherParticipant?.name}</p>
            
            {!currentLocation && !loadingLocation && (
              <div className="location-prompt">
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Click "Get Location" to retrieve your current position
                </p>
                <button className="btn-get-location" onClick={handleGetLocation}>
                  <Navigation size={18} />
                  Get My Location
                </button>
              </div>
            )}
            
            {loadingLocation && (
              <div className="location-loading">
                <div className="spinner"></div>
                <p>Getting your location...</p>
              </div>
            )}
            
            {currentLocation && (
              <>
                <div className="location-preview">
                  <MapPin size={20} />
                  <span>{currentLocation.address}</span>
                </div>
                <div className="location-coords">
                  <small>Coordinates: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}</small>
                </div>
              </>
            )}
            
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => {
                setShowLocationModal(false);
                setCurrentLocation(null);
              }}>
                Cancel
              </button>
              <button 
                className="btn-share-location" 
                onClick={handleShareLocation}
                disabled={!currentLocation}
                style={{ opacity: currentLocation ? 1 : 0.5 }}
              >
                <MapPin size={18} />
                Share Location
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Call Modal */}
      {showCallModal && (
        <div className="modal-overlay">
          <div className="call-modal">
            <div className="call-avatar">
              {otherParticipant?.avatar ? (
                <img src={otherParticipant.avatar} alt={otherParticipant.name} />
              ) : (
                <div className="avatar-placeholder large">{otherParticipant?.name.charAt(0)}</div>
              )}
            </div>
            <h3>{showCallModal === 'video' ? 'Video Call' : 'Voice Call'}</h3>
            <p>Calling {otherParticipant?.name}...</p>
            <div className="call-status">
              <div className="calling-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            <button 
              className="btn-end-call" 
              onClick={() => setShowCallModal(null)}
            >
              {showCallModal === 'video' ? <VideoIcon size={24} /> : <PhoneCall size={24} />}
              End Call
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
