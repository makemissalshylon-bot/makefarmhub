import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import { errorTracking } from './services/errorTracking'
import { analytics } from './services/analytics'
import './style.css'

// Initialize monitoring and analytics
errorTracking.init();
analytics.init();
analytics.trackWebVitals();

// Defer heavy service initialization to after first render
requestIdleCallback(() => {
  import('./services/crashProtectionService').then(({ crashProtectionService }) => {
    crashProtectionService.init();
  });
  import('./services/dataProtectionService').then(({ dataProtectionService }) => {
    dataProtectionService.createBackup('auto', 'App startup backup');
  });
}, { timeout: 3000 });

// Register PWA service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
      })
      .catch((err) => {
        console.warn('PWA registration failed:', err);
      });
  });
}

ReactDOM.createRoot(document.getElementById('app') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
