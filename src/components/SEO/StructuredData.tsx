import { useEffect } from 'react';

interface OrganizationData {
  name: string;
  url: string;
  logo: string;
  description: string;
  contactPoint?: {
    telephone: string;
    contactType: string;
  };
}

interface ProductData {
  name: string;
  description: string;
  image: string;
  price: number;
  currency: string;
  availability: 'InStock' | 'OutOfStock' | 'PreOrder';
  seller: string;
  category: string;
}

interface StructuredDataProps {
  type: 'organization' | 'product' | 'breadcrumb';
  data: OrganizationData | ProductData | { items: Array<{ name: string; url: string }> };
}

export default function StructuredData({ type, data }: StructuredDataProps) {
  useEffect(() => {
    const scriptId = `structured-data-${type}`;
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }

    let jsonLd = {};

    if (type === 'organization') {
      const orgData = data as OrganizationData;
      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: orgData.name,
        url: orgData.url,
        logo: orgData.logo,
        description: orgData.description,
        contactPoint: orgData.contactPoint ? {
          '@type': 'ContactPoint',
          telephone: orgData.contactPoint.telephone,
          contactType: orgData.contactPoint.contactType
        } : undefined,
        sameAs: [
          'https://facebook.com/makefarmhub',
          'https://twitter.com/makefarmhub',
          'https://instagram.com/makefarmhub'
        ]
      };
    } else if (type === 'product') {
      const productData = data as ProductData;
      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: productData.name,
        description: productData.description,
        image: productData.image,
        category: productData.category,
        offers: {
          '@type': 'Offer',
          price: productData.price,
          priceCurrency: productData.currency,
          availability: `https://schema.org/${productData.availability}`,
          seller: {
            '@type': 'Organization',
            name: productData.seller
          }
        }
      };
    } else if (type === 'breadcrumb') {
      const breadcrumbData = data as { items: Array<{ name: string; url: string }> };
      jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbData.items.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url
        }))
      };
    }

    script.textContent = JSON.stringify(jsonLd);

    return () => {
      // Cleanup on unmount
    };
  }, [type, data]);

  return null;
}

// Default organization data
export const defaultOrganizationData: OrganizationData = {
  name: 'MAKEFARMHUB',
  url: 'https://makefarmhub.vercel.app',
  logo: 'https://makefarmhub.vercel.app/icons/icon-512x512.svg',
  description: 'Zimbabwe\'s leading digital agriculture marketplace connecting farmers, buyers, and transporters.',
  contactPoint: {
    telephone: '+263-XXX-XXXXXX',
    contactType: 'customer service'
  }
};
