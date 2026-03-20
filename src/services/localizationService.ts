/**
 * Localization Service
 * Multi-language support for English, Shona, and Ndebele
 */

export type Language = 'en' | 'sn' | 'nd';

interface Translations {
  [key: string]: {
    en: string;
    sn: string;
    nd: string;
  };
}

const translations: Translations = {
  'nav.home': { en: 'Home', sn: 'Musha', nd: 'Ikhaya' },
  'nav.marketplace': { en: 'Marketplace', sn: 'Musika', nd: 'Imakethe' },
  'nav.messages': { en: 'Messages', sn: 'Mameseji', nd: 'Imilayezo' },
  'nav.orders': { en: 'Orders', sn: 'Maodha', nd: 'Ama-order' },
  'nav.wallet': { en: 'Wallet', sn: 'Chikwama', nd: 'Isikhwama' },
  'nav.profile': { en: 'Profile', sn: 'Profile', nd: 'Iphrofayili' },
  
  'common.search': { en: 'Search', sn: 'Tsvaga', nd: 'Funa' },
  'common.filter': { en: 'Filter', sn: 'Sarudza', nd: 'Hlunga' },
  'common.buy': { en: 'Buy', sn: 'Tenga', nd: 'Thenga' },
  'common.sell': { en: 'Sell', sn: 'Tengesa', nd: 'Thengisa' },
  'common.price': { en: 'Price', sn: 'Mutengo', nd: 'Intengo' },
  'common.quantity': { en: 'Quantity', sn: 'Huwandu', nd: 'Ubuningi' },
  'common.location': { en: 'Location', sn: 'Nzvimbo', nd: 'Indawo' },
  'common.confirm': { en: 'Confirm', sn: 'Simbisa', nd: 'Qinisekisa' },
  'common.cancel': { en: 'Cancel', sn: 'Kanzura', nd: 'Khansela' },
  'common.save': { en: 'Save', sn: 'Chengetedza', nd: 'Gcina' },
  'common.delete': { en: 'Delete', sn: 'Bvisa', nd: 'Cima' },
  'common.edit': { en: 'Edit', sn: 'Gadzirisa', nd: 'Hlela' },
  
  'products.maize': { en: 'Maize', sn: 'Chibage', nd: 'Umbila' },
  'products.wheat': { en: 'Wheat', sn: 'Gorosi', nd: 'Ingqoloyi' },
  'products.tobacco': { en: 'Tobacco', sn: 'Fodya', nd: 'Ugwayi' },
  'products.cattle': { en: 'Cattle', sn: 'Mombe', nd: 'Inkomo' },
  'products.goats': { en: 'Goats', sn: 'Mbudzi', nd: 'Imbuzi' },
  'products.tomatoes': { en: 'Tomatoes', sn: 'Madomasi', nd: 'Utamatisi' },
  'products.potatoes': { en: 'Potatoes', sn: 'Mbatatisi', nd: 'Amazambane' },
  
  'auth.login': { en: 'Login', sn: 'Pinda', nd: 'Ngena' },
  'auth.logout': { en: 'Logout', sn: 'Buda', nd: 'Phuma' },
  'auth.signup': { en: 'Sign Up', sn: 'Nyoresa', nd: 'Bhalisa' },
  'auth.email': { en: 'Email', sn: 'Email', nd: 'I-email' },
  'auth.password': { en: 'Password', sn: 'Password', nd: 'Iphasiwedi' },
  'auth.phone': { en: 'Phone Number', sn: 'Nhamba yeFoni', nd: 'Inombolo yocingo' },
  
  'listing.create': { en: 'Create Listing', sn: 'Tumira Chinhu', nd: 'Dala into' },
  'listing.title': { en: 'Title', sn: 'Musoro', nd: 'Isihloko' },
  'listing.description': { en: 'Description', sn: 'Tsananguro', nd: 'Incazelo' },
  'listing.category': { en: 'Category', sn: 'Rudzi', nd: 'Uhlobo' },
  
  'order.status.pending': { en: 'Pending', sn: 'Kumirira', nd: 'Kulindile' },
  'order.status.confirmed': { en: 'Confirmed', sn: 'Yakasimbiswa', nd: 'Iqinisekisiwe' },
  'order.status.delivered': { en: 'Delivered', sn: 'Yasvika', nd: 'Ifikiwe' },
  'order.status.cancelled': { en: 'Cancelled', sn: 'Yakanzurwa', nd: 'Ikhanselwe' },
  
  'payment.method': { en: 'Payment Method', sn: 'Nzira yekubhadhara', nd: 'Indlela yokukhokha' },
  'payment.card': { en: 'Card', sn: 'Kadhi', nd: 'Ikhadi' },
  'payment.mobile': { en: 'Mobile Money', sn: 'Mari yeFoni', nd: 'Imali yocingo' },
  'payment.total': { en: 'Total', sn: 'Yakazara', nd: 'Isamba' },
  
  'wallet.balance': { en: 'Balance', sn: 'Bhareji', nd: 'Ibhalansi' },
  'wallet.deposit': { en: 'Deposit', sn: 'Isa Mari', nd: 'Faka imali' },
  'wallet.withdraw': { en: 'Withdraw', sn: 'Tora Mari', nd: 'Khipha imali' },
  'wallet.transaction': { en: 'Transaction', sn: 'Transaction', nd: 'Ithransekshini' },
};

export const localizationService = {
  currentLanguage: 'en' as Language,

  /**
   * Set current language
   */
  setLanguage(lang: Language) {
    this.currentLanguage = lang;
    localStorage.setItem('app_language', lang);
    document.documentElement.lang = lang;
  },

  /**
   * Get current language
   */
  getLanguage(): Language {
    const stored = localStorage.getItem('app_language') as Language;
    return stored || this.currentLanguage;
  },

  /**
   * Translate a key
   */
  t(key: string): string {
    const translation = translations[key];
    if (!translation) return key;
    return translation[this.currentLanguage] || translation.en || key;
  },

  /**
   * Get all available languages
   */
  getAvailableLanguages() {
    return [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'sn', name: 'Shona', nativeName: 'Shona' },
      { code: 'nd', name: 'Ndebele', nativeName: 'isiNdebele' },
    ];
  },

  /**
   * Format currency with localization
   */
  formatCurrency(amount: number, currency: 'USD' | 'ZWL' = 'USD'): string {
    const symbols = { USD: '$', ZWL: 'Z$' };
    return `${symbols[currency]}${amount.toFixed(2)}`;
  },

  /**
   * Format date with localization
   */
  formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString(this.getLocale());
  },

  /**
   * Get locale code
   */
  getLocale(): string {
    const locales = { en: 'en-ZW', sn: 'sn-ZW', nd: 'nd-ZW' };
    return locales[this.currentLanguage];
  },

  /**
   * Initialize language from storage
   */
  init() {
    const lang = this.getLanguage();
    this.setLanguage(lang);
  },
};

// Auto-initialize
if (typeof window !== 'undefined') {
  localizationService.init();
}
