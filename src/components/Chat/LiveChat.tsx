import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Paperclip, Image, Phone, Video, MoreVertical, Check, CheckCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './LiveChat.css';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  type: 'text' | 'image' | 'file';
  fileUrl?: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read';
}

interface ChatContact {
  id: string;
  name: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
  isOnline: boolean;
  role: 'farmer' | 'buyer' | 'transporter';
}

export default function LiveChat() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load mock contacts
  useEffect(() => {
    setContacts([
      {
        id: 'contact-1',
        name: 'John Farmer',
        avatar: '/avatars/farmer1.jpg',
        lastMessage: 'The tomatoes are ready for pickup',
        lastMessageTime: new Date(Date.now() - 1000 * 60 * 5),
        unreadCount: 2,
        isOnline: true,
        role: 'farmer'
      },
      {
        id: 'contact-2',
        name: 'Sarah Buyer',
        avatar: '/avatars/buyer1.jpg',
        lastMessage: 'Can you deliver to Harare?',
        lastMessageTime: new Date(Date.now() - 1000 * 60 * 30),
        unreadCount: 0,
        isOnline: true,
        role: 'buyer'
      },
      {
        id: 'contact-3',
        name: 'Mike Transport',
        avatar: '/avatars/transporter1.jpg',
        lastMessage: 'I can pick up tomorrow at 8am',
        lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2),
        unreadCount: 0,
        isOnline: false,
        role: 'transporter'
      }
    ]);
  }, []);

  // Load messages for active chat
  useEffect(() => {
    if (activeChat) {
      setMessages([
        {
          id: 'msg-1',
          senderId: activeChat,
          senderName: contacts.find(c => c.id === activeChat)?.name || 'User',
          content: 'Hello! I saw your listing for fresh tomatoes.',
          type: 'text',
          timestamp: new Date(Date.now() - 1000 * 60 * 10),
          status: 'read'
        },
        {
          id: 'msg-2',
          senderId: user?.id || 'me',
          senderName: user?.name || 'You',
          content: 'Yes! They are grade A quality, harvested yesterday.',
          type: 'text',
          timestamp: new Date(Date.now() - 1000 * 60 * 8),
          status: 'read'
        },
        {
          id: 'msg-3',
          senderId: activeChat,
          senderName: contacts.find(c => c.id === activeChat)?.name || 'User',
          content: 'Great! What\'s your best price for 50kg?',
          type: 'text',
          timestamp: new Date(Date.now() - 1000 * 60 * 5),
          status: 'read'
        }
      ]);
    }
  }, [activeChat, contacts, user]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!message.trim() || !activeChat) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: user?.id || 'me',
      senderName: user?.name || 'You',
      content: message,
      type: 'text',
      timestamp: new Date(),
      status: 'sending'
    };

    setMessages(prev => [...prev, newMessage]);
    setMessage('');

    // Simulate message sent
    setTimeout(() => {
      setMessages(prev =>
        prev.map(m => m.id === newMessage.id ? { ...m, status: 'sent' } : m)
      );
    }, 500);

    // Simulate delivered
    setTimeout(() => {
      setMessages(prev =>
        prev.map(m => m.id === newMessage.id ? { ...m, status: 'delivered' } : m)
      );
    }, 1000);

    // Simulate typing response
    setTimeout(() => {
      setIsTyping(true);
    }, 1500);

    // Simulate reply
    setTimeout(() => {
      setIsTyping(false);
      const reply: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        senderId: activeChat,
        senderName: contacts.find(c => c.id === activeChat)?.name || 'User',
        content: getAutoReply(message),
        type: 'text',
        timestamp: new Date(),
        status: 'read'
      };
      setMessages(prev => [...prev, reply]);
    }, 3000);
  };

  const getAutoReply = (msg: string): string => {
    const lowerMsg = msg.toLowerCase();
    if (lowerMsg.includes('price') || lowerMsg.includes('cost')) {
      return 'I can offer a good bulk discount. Let me check current rates.';
    }
    if (lowerMsg.includes('deliver') || lowerMsg.includes('pickup')) {
      return 'I can arrange delivery. What\'s your preferred location?';
    }
    if (lowerMsg.includes('quality') || lowerMsg.includes('fresh')) {
      return 'I guarantee the quality! All produce is inspected before dispatch.';
    }
    return 'Thanks for your message! I\'ll get back to you shortly.';
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeChat) {
      const newMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        senderId: user?.id || 'me',
        senderName: user?.name || 'You',
        content: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'file',
        fileUrl: URL.createObjectURL(file),
        timestamp: new Date(),
        status: 'sending'
      };
      setMessages(prev => [...prev, newMessage]);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const totalUnread = contacts.reduce((sum, c) => sum + c.unreadCount, 0);

  if (!user) return null;

  return (
    <>
      {/* Chat Button */}
      <button className="live-chat-button" onClick={() => setIsOpen(true)}>
        <MessageCircle size={24} />
        {totalUnread > 0 && <span className="chat-badge">{totalUnread}</span>}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="live-chat-window">
          <div className="chat-header">
            {activeChat ? (
              <>
                <button className="back-btn" onClick={() => setActiveChat(null)}>←</button>
                <div className="chat-contact-info">
                  <div className="contact-avatar">
                    {contacts.find(c => c.id === activeChat)?.name[0]}
                    {contacts.find(c => c.id === activeChat)?.isOnline && 
                      <span className="online-dot" />}
                  </div>
                  <div>
                    <h3>{contacts.find(c => c.id === activeChat)?.name}</h3>
                    <span className="contact-status">
                      {isTyping ? 'typing...' : 
                        contacts.find(c => c.id === activeChat)?.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
                <div className="chat-actions">
                  <button title="Voice Call"><Phone size={18} /></button>
                  <button title="Video Call"><Video size={18} /></button>
                  <button title="More"><MoreVertical size={18} /></button>
                </div>
              </>
            ) : (
              <>
                <h3>Messages</h3>
                <span className="chat-subtitle">{contacts.length} conversations</span>
              </>
            )}
          </div>

          <div className="chat-body">
            {activeChat ? (
              <>
                <div className="messages-container">
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`message ${msg.senderId === user?.id || msg.senderId === 'me' ? 'sent' : 'received'}`}
                    >
                      {msg.type === 'image' && msg.fileUrl && (
                        <img src={msg.fileUrl} alt="Shared" className="message-image" />
                      )}
                      {msg.type === 'file' && (
                        <div className="message-file">
                          <Paperclip size={16} />
                          <span>{msg.content}</span>
                        </div>
                      )}
                      {msg.type === 'text' && <p>{msg.content}</p>}
                      <div className="message-meta">
                        <span className="message-time">{formatTime(msg.timestamp)}</span>
                        {(msg.senderId === user?.id || msg.senderId === 'me') && (
                          <span className="message-status">
                            {msg.status === 'read' ? <CheckCheck size={14} className="read" /> :
                             msg.status === 'delivered' ? <CheckCheck size={14} /> :
                             <Check size={14} />}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="typing-indicator">
                      <span></span><span></span><span></span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="chat-input">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                    accept="image/*,.pdf,.doc,.docx"
                  />
                  <button onClick={() => fileInputRef.current?.click()}>
                    <Image size={20} />
                  </button>
                  <input
                    type="text"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleSend()}
                    placeholder="Type a message..."
                  />
                  <button className="send-btn" onClick={handleSend} disabled={!message.trim()}>
                    <Send size={20} />
                  </button>
                </div>
              </>
            ) : (
              <div className="contacts-list">
                {contacts.map(contact => (
                  <div
                    key={contact.id}
                    className="contact-item"
                    onClick={() => setActiveChat(contact.id)}
                  >
                    <div className="contact-avatar">
                      {contact.name[0]}
                      {contact.isOnline && <span className="online-dot" />}
                    </div>
                    <div className="contact-details">
                      <div className="contact-name-row">
                        <h4>{contact.name}</h4>
                        <span className="contact-time">
                          {contact.lastMessageTime && formatTime(contact.lastMessageTime)}
                        </span>
                      </div>
                      <div className="contact-message-row">
                        <p>{contact.lastMessage}</p>
                        {contact.unreadCount > 0 && (
                          <span className="unread-badge">{contact.unreadCount}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="chat-footer-bar">
            <button
              type="button"
              className="close-chat"
              onClick={() => { setIsOpen(false); setActiveChat(null); }}
              aria-label="Close messages"
            >
              <X size={20} />
              <span>Close</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
