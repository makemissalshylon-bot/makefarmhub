/**
 * SEOService - Dynamic meta tags, Open Graph, and structured data
 */

// Meta tag configuration
export interface MetaConfig {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product' | 'profile';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
}

// Product structured data
export interface ProductSchema {
  name: string;
  description: string;
  image: string[];
  price: number;
  currency: string;
  availability: 'InStock' | 'OutOfStock' | 'PreOrder';
  seller: {
    name: string;
    url?: string;
  };
  category?: string;
  rating?: {
    value: number;
    count: number;
  };
  sku?: string;
}

// Organization structured data
export interface OrganizationSchema {
  name: string;
  url: string;
  logo: string;
  description?: string;
  address?: {
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry: string;
  };
  contactPoint?: {
    telephone: string;
    contactType: string;
  };
  sameAs?: string[];
}

// Breadcrumb item
export interface BreadcrumbItem {
  name: string;
  url: string;
}

const DEFAULT_META: MetaConfig = {
  title: 'MAKEFARMHUB - Zimbabwe\'s Digital Agriculture Marketplace',
  description: 'Connect with farmers, buyers, and transporters across Zimbabwe. Buy and sell fresh produce, livestock, and farm equipment.',
  keywords: ['agriculture', 'farming', 'marketplace', 'Zimbabwe', 'produce', 'livestock', 'farm equipment'],
  image: '/og-image.jpg',
  type: 'website',
};

const SITE_NAME = 'MAKEFARMHUB';
const SITE_URL =
  (import.meta.env.VITE_APP_URL as string | undefined)?.replace(/\/$/, '') ||
  'https://makefarmhub-eosin.vercel.app';

class SEOService {
  private currentMeta: MetaConfig = { ...DEFAULT_META };

  /**
   * Update page meta tags
   */
  updateMeta(config: MetaConfig): void {
    this.currentMeta = { ...DEFAULT_META, ...config };
    this.applyMeta();
  }

  /**
   * Apply meta tags to document
   */
  private applyMeta(): void {
    const { title, description, keywords, image, url, type, author, publishedTime, modifiedTime } = this.currentMeta;

    // Title
    document.title = title ? `${title} | ${SITE_NAME}` : SITE_NAME;

    // Basic meta tags
    this.setMetaTag('description', description);
    this.setMetaTag('keywords', keywords?.join(', '));
    this.setMetaTag('author', author);

    // Open Graph
    this.setMetaTag('og:title', title, 'property');
    this.setMetaTag('og:description', description, 'property');
    this.setMetaTag('og:image', image ? this.getAbsoluteUrl(image) : undefined, 'property');
    this.setMetaTag('og:url', url || window.location.href, 'property');
    this.setMetaTag('og:type', type, 'property');
    this.setMetaTag('og:site_name', SITE_NAME, 'property');

    // Twitter Card
    this.setMetaTag('twitter:card', 'summary_large_image', 'name');
    this.setMetaTag('twitter:title', title, 'name');
    this.setMetaTag('twitter:description', description, 'name');
    this.setMetaTag('twitter:image', image ? this.getAbsoluteUrl(image) : undefined, 'name');

    // Article meta (for blog posts, listings)
    if (type === 'article') {
      this.setMetaTag('article:published_time', publishedTime, 'property');
      this.setMetaTag('article:modified_time', modifiedTime, 'property');
      this.setMetaTag('article:author', author, 'property');
    }

    // Canonical URL
    this.setCanonicalUrl(url || window.location.href);
  }

  /**
   * Set or update a meta tag
   */
  private setMetaTag(name: string, content?: string, attribute: 'name' | 'property' = 'name'): void {
    if (!content) {
      // Remove tag if no content
      const existing = document.querySelector(`meta[${attribute}="${name}"]`);
      if (existing) existing.remove();
      return;
    }

    let tag = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
    
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute(attribute, name);
      document.head.appendChild(tag);
    }
    
    tag.content = content;
  }

  /**
   * Set canonical URL
   */
  private setCanonicalUrl(url: string): void {
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    
    link.href = this.getAbsoluteUrl(url);
  }

  /**
   * Get absolute URL
   */
  private getAbsoluteUrl(path: string): string {
    if (path.startsWith('http')) return path;
    return `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  }

  /**
   * Add product structured data (JSON-LD)
   */
  addProductSchema(product: ProductSchema): void {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      image: product.image,
      sku: product.sku,
      category: product.category,
      offers: {
        '@type': 'Offer',
        price: product.price,
        priceCurrency: product.currency,
        availability: `https://schema.org/${product.availability}`,
        seller: {
          '@type': 'Organization',
          name: product.seller.name,
          url: product.seller.url,
        },
      },
      ...(product.rating && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: product.rating.value,
          reviewCount: product.rating.count,
        },
      }),
    };

    this.addJsonLd('product-schema', schema);
  }

  /**
   * Add organization structured data
   */
  addOrganizationSchema(org: OrganizationSchema): void {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: org.name,
      url: org.url,
      logo: org.logo,
      description: org.description,
      ...(org.address && {
        address: {
          '@type': 'PostalAddress',
          ...org.address,
        },
      }),
      ...(org.contactPoint && {
        contactPoint: {
          '@type': 'ContactPoint',
          ...org.contactPoint,
        },
      }),
      sameAs: org.sameAs,
    };

    this.addJsonLd('organization-schema', schema);
  }

  /**
   * Add breadcrumb structured data
   */
  addBreadcrumbSchema(items: BreadcrumbItem[]): void {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: this.getAbsoluteUrl(item.url),
      })),
    };

    this.addJsonLd('breadcrumb-schema', schema);
  }

  /**
   * Add search action structured data (for site search)
   */
  addSearchActionSchema(): void {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_URL}/marketplace?search={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    };

    this.addJsonLd('search-action-schema', schema);
  }

  /**
   * Add FAQ structured data
   */
  addFAQSchema(faqs: { question: string; answer: string }[]): void {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    };

    this.addJsonLd('faq-schema', schema);
  }

  /**
   * Add local business structured data
   */
  addLocalBusinessSchema(): void {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: SITE_NAME,
      description: 'Digital agriculture marketplace connecting farmers, buyers, and transporters in Zimbabwe',
      url: SITE_URL,
      telephone: '+263782919633',
      email: 'missal@makefarmhub.com',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Harare',
        addressCountry: 'Zimbabwe',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: -17.8292,
        longitude: 31.0522,
      },
      openingHours: 'Mo-Su 00:00-24:00',
      priceRange: '$$',
    };

    this.addJsonLd('local-business-schema', schema);
  }

  /**
   * Add JSON-LD script to document
   */
  private addJsonLd(id: string, data: object): void {
    // Remove existing
    const existing = document.getElementById(id);
    if (existing) existing.remove();

    // Create new script
    const script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  /**
   * Remove JSON-LD script
   */
  removeJsonLd(id: string): void {
    const existing = document.getElementById(id);
    if (existing) existing.remove();
  }

  /**
   * Clear all JSON-LD scripts
   */
  clearAllJsonLd(): void {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    scripts.forEach(script => script.remove());
  }

  /**
   * Reset to default meta
   */
  resetMeta(): void {
    this.currentMeta = { ...DEFAULT_META };
    this.applyMeta();
  }

  /**
   * Generate sitemap data (for static generation)
   */
  generateSitemapData(): { url: string; lastmod: string; changefreq: string; priority: number }[] {
    return [
      { url: '/', lastmod: new Date().toISOString(), changefreq: 'daily', priority: 1.0 },
      { url: '/marketplace', lastmod: new Date().toISOString(), changefreq: 'hourly', priority: 0.9 },
      { url: '/login', lastmod: new Date().toISOString(), changefreq: 'monthly', priority: 0.5 },
      { url: '/signup', lastmod: new Date().toISOString(), changefreq: 'monthly', priority: 0.5 },
      { url: '/privacy-policy', lastmod: new Date().toISOString(), changefreq: 'yearly', priority: 0.3 },
      { url: '/terms-conditions', lastmod: new Date().toISOString(), changefreq: 'yearly', priority: 0.3 },
    ];
  }
}

// Singleton instance
export const seoService = new SEOService();

export default seoService;
