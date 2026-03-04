import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import { crashProtectionService } from './services/crashProtectionService'
import { dataProtectionService } from './services/dataProtectionService'
import './style.css'

// Initialize crash protection and auto-backup
crashProtectionService.init();

// Create initial backup on app start
dataProtectionService.createBackup('auto', 'App startup backup');

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
