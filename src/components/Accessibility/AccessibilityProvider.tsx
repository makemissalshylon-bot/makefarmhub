import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReaderMode: boolean;
  keyboardNavigation: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: (key: keyof AccessibilitySettings, value: boolean) => void;
  resetSettings: () => void;
}

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  largeText: false,
  reducedMotion: false,
  screenReaderMode: false,
  keyboardNavigation: true,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    const saved = localStorage.getItem('mfh_accessibility');
    if (saved) {
      return { ...defaultSettings, ...JSON.parse(saved) };
    }
    // Check system preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    return {
      ...defaultSettings,
      reducedMotion: prefersReducedMotion,
      highContrast: prefersHighContrast,
    };
  });

  useEffect(() => {
    localStorage.setItem('mfh_accessibility', JSON.stringify(settings));
    
    // Apply settings to document
    const root = document.documentElement;
    
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    if (settings.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }
    
    if (settings.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
    
    if (settings.screenReaderMode) {
      root.setAttribute('role', 'application');
      root.setAttribute('aria-label', 'MakeFarmHub Application');
    } else {
      root.removeAttribute('role');
      root.removeAttribute('aria-label');
    }
  }, [settings]);

  // Keyboard navigation handler
  useEffect(() => {
    if (!settings.keyboardNavigation) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip to main content with Alt+1
      if (e.altKey && e.key === '1') {
        e.preventDefault();
        const main = document.querySelector('main, [role="main"]');
        if (main instanceof HTMLElement) {
          main.focus();
          main.scrollIntoView();
        }
      }
      
      // Skip to navigation with Alt+2
      if (e.altKey && e.key === '2') {
        e.preventDefault();
        const nav = document.querySelector('nav, [role="navigation"]');
        if (nav instanceof HTMLElement) {
          const firstLink = nav.querySelector('a, button');
          if (firstLink instanceof HTMLElement) {
            firstLink.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [settings.keyboardNavigation]);

  const updateSetting = (key: keyof AccessibilitySettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return (
    <AccessibilityContext.Provider value={{ settings, updateSetting, resetSettings }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
}
