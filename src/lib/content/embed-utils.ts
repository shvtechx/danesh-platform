function escapeHtmlAttribute(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function getProvider(hostname: string) {
  const normalizedHost = hostname.toLowerCase();

  if (normalizedHost.includes('youtube.com') || normalizedHost.includes('youtu.be')) return 'youtube';
  if (normalizedHost.includes('vimeo.com')) return 'vimeo';
  if (normalizedHost.includes('aparat.com')) return 'aparat';
  if (normalizedHost.includes('phet.colorado.edu')) return 'phet';
  if (normalizedHost.includes('geogebra.org')) return 'geogebra';
  if (normalizedHost.includes('jitsi')) return 'jitsi';

  return normalizedHost.replace(/^www\./, '');
}

export function normalizeExternalEmbedUrl(url: string): string {
  try {
    const parsedUrl = new URL(url.trim());
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return '';
    }

    const ytId =
      parsedUrl.searchParams.get('v') ||
      (parsedUrl.hostname === 'youtu.be' ? parsedUrl.pathname.slice(1) : null) ||
      (parsedUrl.pathname.includes('/shorts/') ? parsedUrl.pathname.split('/shorts/')[1] : null) ||
      (parsedUrl.pathname.includes('/embed/') ? parsedUrl.pathname.split('/embed/')[1] : null);

    if (ytId) {
      return `https://www.youtube.com/embed/${ytId}?rel=0`;
    }

    if (parsedUrl.hostname.includes('vimeo.com')) {
      const videoId = parsedUrl.pathname.split('/').filter(Boolean)[0];
      if (videoId) {
        return `https://player.vimeo.com/video/${videoId}`;
      }
    }

    if (parsedUrl.hostname.includes('aparat.com')) {
      const hash = parsedUrl.pathname.split('/v/')[1]?.split('/')[0];
      if (hash) {
        return `https://www.aparat.com/video/video/embed/videohash/${hash}/vt/frame`;
      }
    }

    return parsedUrl.toString();
  } catch {
    return '';
  }
}

export type SafeEmbedConfig = {
  originalInput: string;
  sourceType: 'url' | 'iframe' | 'unsupported';
  provider: string | null;
  embedUrl: string | null;
  title: string | null;
  normalizedHtml: string | null;
};

export function buildSafeIframeHtml(embedUrl: string, title = 'Embedded interactive content') {
  const safeUrl = normalizeExternalEmbedUrl(embedUrl);
  if (!safeUrl) return null;

  return `<iframe src="${escapeHtmlAttribute(safeUrl)}" title="${escapeHtmlAttribute(title)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" style="width:100%;min-height:420px;border:0;border-radius:16px;background:#fff"></iframe>`;
}

export function extractSafeEmbedConfig(input: string): SafeEmbedConfig {
  const originalInput = input || '';
  const trimmedInput = originalInput.trim();

  if (!trimmedInput) {
    return {
      originalInput,
      sourceType: 'unsupported',
      provider: null,
      embedUrl: null,
      title: null,
      normalizedHtml: null,
    };
  }

  const iframeMatch = trimmedInput.match(/<iframe[^>]*src=["']([^"']+)["'][^>]*>/i);
  const iframeTitleMatch = trimmedInput.match(/<iframe[^>]*title=["']([^"']+)["'][^>]*>/i);

  if (iframeMatch?.[1]) {
    const embedUrl = normalizeExternalEmbedUrl(iframeMatch[1]);
    if (!embedUrl) {
      return {
        originalInput,
        sourceType: 'unsupported',
        provider: null,
        embedUrl: null,
        title: null,
        normalizedHtml: null,
      };
    }

    const title = iframeTitleMatch?.[1] || 'Embedded interactive content';
    const provider = (() => {
      try {
        return getProvider(new URL(embedUrl).hostname);
      } catch {
        return null;
      }
    })();

    return {
      originalInput,
      sourceType: 'iframe',
      provider,
      embedUrl,
      title,
      normalizedHtml: buildSafeIframeHtml(embedUrl, title),
    };
  }

  const embedUrl = normalizeExternalEmbedUrl(trimmedInput);
  if (!embedUrl) {
    return {
      originalInput,
      sourceType: 'unsupported',
      provider: null,
      embedUrl: null,
      title: null,
      normalizedHtml: null,
    };
  }

  let provider: string | null = null;
  try {
    provider = getProvider(new URL(embedUrl).hostname);
  } catch {
    provider = null;
  }

  return {
    originalInput,
    sourceType: 'url',
    provider,
    embedUrl,
    title: null,
    normalizedHtml: buildSafeIframeHtml(embedUrl),
  };
}
