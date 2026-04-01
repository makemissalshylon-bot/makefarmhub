import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './NotFound.css';

export default function NotFound() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="not-found">
      <div className="not-found-content">
        <div className="not-found-code">404</div>
        <h1>Page Not Found</h1>
        <p className="not-found-message">
          Sorry, the page you're looking for doesn't exist or has been moved.
        </p>
        <div className="not-found-actions">
          <button className="not-found-btn primary" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
            Go Back
          </button>
          <button
            className="not-found-btn secondary"
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')}
          >
            <Home size={18} />
            {isAuthenticated ? 'Dashboard' : 'Home'}
          </button>
          {isAuthenticated && (
            <button className="not-found-btn secondary" onClick={() => navigate('/marketplace')}>
              <Search size={18} />
              Marketplace
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
