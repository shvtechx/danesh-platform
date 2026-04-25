'use client';

import Script from 'next/script';

interface JsonLdProps {
  type: 'Organization' | 'WebSite' | 'Course' | 'BreadcrumbList';
  data: Record<string, unknown>;
}

export function JsonLd({ type, data }: JsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': type,
    ...data,
  };

  return (
    <Script
      id={`json-ld-${type.toLowerCase()}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function OrganizationJsonLd() {
  return (
    <JsonLd
      type="Organization"
      data={{
        name: 'Danesh',
        url: 'https://danesh.app',
        logo: 'https://danesh.app/logo.png',
        sameAs: [
          'https://twitter.com/daneshapp',
          'https://facebook.com/daneshapp',
        ],
      }}
    />
  );
}

export function WebSiteJsonLd() {
  return (
    <JsonLd
      type="WebSite"
      data={{
        name: 'Danesh',
        url: 'https://danesh.app',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://danesh.app/search?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      }}
    />
  );
}
