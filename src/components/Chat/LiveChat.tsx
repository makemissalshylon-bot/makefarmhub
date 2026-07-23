import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './LiveChat.css';

/**
 * Floating messages entry — opens the real Messages page.
 * (Previous mock chat contacts were removed.)
 */
export default function LiveChat() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  if (!isAuthenticated) return null;

  const goToMessages = () => {
    setIsOpen(false);
    navigate('/messages');
  };

  return (
    <>
      <button
        type="button"
        className="live-chat-button"
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Open messages"
      >
        <MessageCircle size={28} />
      </button>

      {isOpen && (
        <div className="live-chat-window live-chat-window--compact" ref={panelRef}>
          <div className="chat-header">
            <h3>Messages</h3>
            <span className="chat-subtitle">Chat with buyers, farmers & transporters</span>
          </div>
          <div className="chat-body chat-body--cta">
            <p>
              Hi {user?.name?.split(' ')[0] || 'there'} — your conversations live in Messages.
            </p>
            <button type="button" className="btn-primary open-messages-btn" onClick={goToMessages}>
              Open Messages
            </button>
          </div>
          <div className="chat-footer-bar">
            <button
              type="button"
              className="close-chat"
              onClick={() => setIsOpen(false)}
              aria-label="Close"
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
