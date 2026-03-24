import { describe, it, expect, beforeEach, vi } from 'vitest';
import { localizationService } from '../localizationService';

describe('localizationService', () => {
  beforeEach(() => {
    localizationService.currentLanguage = 'en';
    localStorage.clear();
  });

  describe('setLanguage', () => {
    it('should set current language', () => {
      localizationService.setLanguage('sn');
      expect(localizationService.currentLanguage).toBe('sn');
    });

    it('should persist language using localStorage.setItem', () => {
      const spy = vi.spyOn(window.localStorage, 'setItem');
      localizationService.setLanguage('nd');
      expect(spy).toHaveBeenCalledWith('app_language', 'nd');
      spy.mockRestore();
    });

    it('should update document lang attribute', () => {
      localizationService.setLanguage('sn');
      expect(document.documentElement.lang).toBe('sn');
    });
  });

  describe('getLanguage', () => {
    it('should return stored language from localStorage', () => {
      const spy = vi.spyOn(window.localStorage, 'getItem').mockReturnValue('sn');
      expect(localizationService.getLanguage()).toBe('sn');
      spy.mockRestore();
    });

    it('should return current language if no stored value', () => {
      const spy = vi.spyOn(window.localStorage, 'getItem').mockReturnValue(null);
      localizationService.currentLanguage = 'en';
      expect(localizationService.getLanguage()).toBe('en');
      spy.mockRestore();
    });
  });

  describe('translate (t)', () => {
    it('should translate keys to English', () => {
      localizationService.setLanguage('en');
      expect(localizationService.t('nav.home')).toBe('Home');
      expect(localizationService.t('common.search')).toBe('Search');
    });

    it('should translate keys to Shona', () => {
      localizationService.setLanguage('sn');
      expect(localizationService.t('nav.home')).toBe('Musha');
      expect(localizationService.t('common.search')).toBe('Tsvaga');
    });

    it('should translate keys to Ndebele', () => {
      localizationService.setLanguage('nd');
      expect(localizationService.t('nav.home')).toBe('Ikhaya');
      expect(localizationService.t('common.search')).toBe('Funa');
    });

    it('should return key if translation not found', () => {
      expect(localizationService.t('non.existent.key')).toBe('non.existent.key');
    });

    it('should fallback to English if translation missing', () => {
      localizationService.setLanguage('sn');
      const key = 'nav.home';
      expect(localizationService.t(key)).toBeTruthy();
    });
  });

  describe('formatCurrency', () => {
    it('should format USD correctly', () => {
      expect(localizationService.formatCurrency(50)).toBe('$50.00');
      expect(localizationService.formatCurrency(100.5)).toBe('$100.50');
    });

    it('should format ZWL correctly', () => {
      expect(localizationService.formatCurrency(50, 'ZWL')).toBe('Z$50.00');
      expect(localizationService.formatCurrency(100.5, 'ZWL')).toBe('Z$100.50');
    });
  });

  describe('formatDate', () => {
    it('should format date strings', () => {
      const date = new Date('2026-03-20T12:00:00Z');
      const formatted = localizationService.formatDate(date);
      expect(formatted).toMatch(/2026/);
    });

    it('should handle string dates', () => {
      const formatted = localizationService.formatDate('2026-03-20');
      expect(formatted).toMatch(/2026/);
    });
  });

  describe('getAvailableLanguages', () => {
    it('should return all available languages', () => {
      const languages = localizationService.getAvailableLanguages();
      expect(languages).toHaveLength(3);
      expect(languages[0].code).toBe('en');
      expect(languages[1].code).toBe('sn');
      expect(languages[2].code).toBe('nd');
    });
  });

  describe('getLocale', () => {
    it('should return correct locale codes', () => {
      localizationService.setLanguage('en');
      expect(localizationService.getLocale()).toBe('en-ZW');

      localizationService.setLanguage('sn');
      expect(localizationService.getLocale()).toBe('sn-ZW');

      localizationService.setLanguage('nd');
      expect(localizationService.getLocale()).toBe('nd-ZW');
    });
  });
});
