import { useEffect } from 'react';
import type { MetaTagsProps } from '../components/SEO/MetaTags';

const SITE_URL =
  (import.meta.env.VITE_APP_URL as string | undefined)?.replace(/\/$/, '') ||
  'https://makefarmhub-eosin.vercel.app';
const DEFAULT_IMAGE = `${SITE_URL}/icons/icon-512x512.svg`;

/**
 * Hook to set document meta tags from any page component.
 * Restores defaults on unmount so stale tags don't leak.
 */
export function useMeta(meta: Partial<MetaTagsProps> = {}) {
  useEffect(() => {
    const title = meta.title ?? 'MAKEFARMHUB - Digital Agriculture Marketplace';
    const description = meta.description ?? 'Connect with farmers, buyers, and transporters across Zimbabwe. Buy and sell fresh produce, livestock, and farm equipment.';
    const keywords = meta.keywords ?? 'agriculture, farming, marketplace, Zimbabwe, produce, livestock, farm equipment';
    const image = meta.image ?? DEFAULT_IMAGE;
    const url = meta.url ? `${SITE_URL}${meta.url}` : SITE_URL;
    const type = meta.type ?? 'website';

    document.title = title;

    const set = (attr: string, name: string, content: string) => {
      const el = document.querySelector(`meta[${attr}="${name}"]`);
      if (el) el.setAttribute('content', content);
    };

    set('name', 'description', description);
    set('name', 'keywords', keywords);
    set('property', 'og:title', title);
    set('property', 'og:description', description);
    set('property', 'og:image', image);
    set('property', 'og:url', url);
    set('property', 'og:type', type);
    set('name', 'twitter:card', 'summary_large_image');
    set('name', 'twitter:title', title);
    set('name', 'twitter:description', description);
    set('name', 'twitter:image', image);
  }, [meta.title, meta.description, meta.keywords, meta.image, meta.url, meta.type]);
}
