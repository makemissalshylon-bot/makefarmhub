import { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './InstallPrompt.css';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const { user } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Only show prompt if user is logged in
    if (!user) return;

    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Check for iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if dismissed recently
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const daysPassed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      if (daysPassed < 7) return; // Don't show for 7 days after dismissal
    }

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show after 10 seconds on the page (only if logged in)
      setTimeout(() => setShowPrompt(true), 10000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // For iOS, show custom prompt after delay (only if logged in)
    if (iOS && !standalone) {
      setTimeout(() => setShowPrompt(true), 10000);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [user]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
        setDeferredPrompt(null);
      }
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <div className="install-prompt">
      <div className="install-prompt-content">
        <button className="install-dismiss" onClick={handleDismiss}>
          <X size={18} />
        </button>
        
        <div className="install-icon">
          <Smartphone size={32} />
        </div>
        
        <div className="install-text">
          <h3>Install MAKEFARMHUB</h3>
          <p>Get quick access and work offline</p>
        </div>

        {isIOS ? (
          <div className="ios-instructions">
            <p className="ios-step"><strong>Step 1:</strong> Tap the <strong>Share</strong> button at the bottom of your screen</p>
            <div className="share-icon-large">⬆️</div>
            <p className="ios-step"><strong>Step 2:</strong> Scroll down and tap <strong>"Add to Home Screen"</strong></p>
            <p className="ios-step"><strong>Step 3:</strong> Tap <strong>"Add"</strong> in the top right corner</p>
            <p className="ios-note">📱 The app will appear on your home screen like any other app!</p>
          </div>
        ) : (
          <button className="install-button-large" onClick={handleInstall}>
            <Download size={24} />
            <span>Install App Now</span>
          </button>
        )}
      </div>
    </div>
  );
}
