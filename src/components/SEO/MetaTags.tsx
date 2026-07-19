import { useEffect } from 'react';

export interface MetaTagsProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
}

export default function MetaTags({
  title = 'MAKEFARMHUB - Digital Agriculture Marketplace',
  description = 'Connect with farmers, buyers, and transporters across Zimbabwe. Buy and sell fresh produce, livestock, and farm equipment.',
  keywords = 'agriculture, farming, marketplace, Zimbabwe, produce, livestock, farm equipment',
  image = '/images/og-image.png',
  url = 'https://makefarmhub.vercel.app',
  type = 'website'
}: MetaTagsProps) {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Helper to update or create meta tag
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let tag = document.querySelector(`meta[${attr}="${name}"]`);
      
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attr, name);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    // Standard meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    updateMetaTag('author', 'MAKEFARMHUB');
    
    // Open Graph tags
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', image, true);
    updateMetaTag('og:url', url, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:site_name', 'MAKEFARMHUB', true);
    
    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);
    
    // Additional SEO tags
    updateMetaTag('robots', 'index, follow');
    updateMetaTag('googlebot', 'index, follow');
    
  }, [title, description, keywords, image, url, type]);

  return null;
}

// Page-specific meta configurations
export const pageMetaConfigs = {
  home: {
    title: 'MAKEFARMHUB - Digital Agriculture Marketplace',
    description: 'Zimbabwe\'s leading agricultural marketplace. Connect with farmers, buyers, and transporters. Buy fresh produce, livestock, and farm equipment.',
    keywords: 'agriculture marketplace, farming Zimbabwe, buy produce, sell crops, livestock market'
  },
  marketplace: {
    title: 'Marketplace - MAKEFARMHUB',
    description: 'Browse thousands of agricultural products from verified farmers across Zimbabwe. Fresh produce, livestock, and equipment.',
    keywords: 'buy produce, farm products, agricultural goods, Zimbabwe farming'
  },
  dashboard: {
    title: 'Dashboard - MAKEFARMHUB',
    description: 'Manage your MAKEFARMHUB account, track orders, and monitor your agricultural business.',
    keywords: 'farmer dashboard, seller dashboard, agricultural management'
  },
  orders: {
    title: 'My Orders - MAKEFARMHUB',
    description: 'Track and manage your agricultural orders on MAKEFARMHUB.',
    keywords: 'order tracking, agricultural orders, farm purchases'
  },
  messages: {
    title: 'Messages - MAKEFARMHUB',
    description: 'Communicate with buyers, sellers, and transporters on MAKEFARMHUB.',
    keywords: 'farmer messaging, buyer communication, agricultural chat'
  }
};
