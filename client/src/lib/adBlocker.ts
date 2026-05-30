/**
 * Ad Blocker Utility
 * Blocks ads, popups, and redirects on VidSrc and MegaPlay
 */

export const AD_BLOCKER_CONFIG = {
  // uBlock Origin filter rules for VidSrc and MegaPlay
  uBlockRules: [
    // VidSrc ad domains
    '||vidsrc.me^$script,xhr',
    '||ads.vidsrc.me^',
    '||analytics.vidsrc.me^',
    '||tracking.vidsrc.me^',
    
    // MegaPlay ad domains
    '||megaplay.buzz^$script,xhr',
    '||ads.megaplay.buzz^',
    '||analytics.megaplay.buzz^',
    '||tracking.megaplay.buzz^',
    
    // Common ad networks
    '||googleadservices.com^',
    '||googlesyndication.com^',
    '||doubleclick.net^',
    '||adnxs.com^',
    '||rubiconproject.com^',
    '||criteo.com^',
    
    // Popup and redirect blockers
    '||popunder.net^',
    '||popads.net^',
    '||popcash.net^',
    '||adcash.com^',
    '||clicksor.com^',
    
    // Tracking pixels
    '||pixel.quantserve.com^',
    '||b.scorecardresearch.com^',
    '||analytics.google.com^',
  ],

  // Adguard DNS filtering
  adguardDNS: {
    primary: '94.140.14.14',
    secondary: '94.140.15.15',
    familyPrimary: '94.140.14.15',
    familySecondary: '94.140.15.16',
  },

  // Content Security Policy headers
  cspHeaders: {
    'script-src': ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
    'img-src': ["'self'", 'data:', 'https:'],
    'style-src': ["'self'", "'unsafe-inline'"],
    'connect-src': ["'self'", 'https://api.anilist.co', 'https://api.themoviedb.org'],
    'frame-src': ["'none'"],
    'object-src': ["'none'"],
  },

  // Popup blocking patterns
  popupPatterns: [
    /window\.open\(/gi,
    /onclick.*window\.open/gi,
    /target=["']_blank["']/gi,
  ],

  // Redirect blocking patterns
  redirectPatterns: [
    /redirect\.php/gi,
    /go\.php/gi,
    /out\.php/gi,
    /exit\.php/gi,
    /aff\.php/gi,
  ],
};

/**
 * Enable ad blocking in iframe
 */
export function enableAdBlockingInIframe(iframeElement: HTMLIFrameElement) {
  try {
    const iframeDoc = iframeElement.contentDocument || iframeElement.contentWindow?.document;
    if (!iframeDoc) return;

    // Block popups
    if (iframeElement.contentWindow) {
      iframeElement.contentWindow.open = () => null as any;
      iframeElement.contentWindow.alert = () => {};
    }

    // Remove ad scripts
    const scripts = iframeDoc.querySelectorAll('script');
    scripts.forEach((script) => {
      const src = script.src || script.textContent || '';
      if (
        src.includes('ads') ||
        src.includes('analytics') ||
        src.includes('tracking') ||
        src.includes('doubleclick') ||
        src.includes('googlesyndication')
      ) {
        script.remove();
      }
    });

    // Remove ad iframes
    const iframes = iframeDoc.querySelectorAll('iframe');
    iframes.forEach((iframe) => {
      const src = iframe.src || '';
      if (
        src.includes('ads') ||
        src.includes('doubleclick') ||
        src.includes('popads') ||
        src.includes('popcash')
      ) {
        iframe.remove();
      }
    });

    // Remove ad divs and spans
    const adElements = iframeDoc.querySelectorAll('[id*="ad"], [class*="ad"], [id*="banner"], [class*="banner"]');
    adElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      if (htmlEl.offsetHeight < 100 || htmlEl.offsetWidth < 100) {
        el.remove();
      }
    });
  } catch (error) {
    console.warn('[AdBlocker] Could not access iframe content:', error);
  }
}

/**
 * Block popup attempts
 */
export function blockPopups() {
  const originalOpen = window.open;
  window.open = function (url: string, target?: string, features?: string) {
    if (
      url &&
      (url.includes('ads') ||
        url.includes('doubleclick') ||
        url.includes('popads') ||
        url.includes('popcash') ||
        url.includes('redirect') ||
        url.includes('exit'))
    ) {
      console.log('[AdBlocker] Blocked popup:', url);
      return null;
    }
    return originalOpen.call(window, url, target, features);
  } as any;
}

/**
 * Block redirects
 */
export function blockRedirects() {
  const originalFetch = window.fetch;
  window.fetch = function (resource: RequestInfo | URL, config?: RequestInit) {
    let url = '';
    if (typeof resource === 'string') {
      url = resource;
    } else if (resource instanceof URL) {
      url = resource.href;
    } else if (typeof resource === 'object' && 'url' in resource) {
      url = (resource as any).url;
    }
    if (
      url &&
      (url.includes('redirect') ||
        url.includes('exit') ||
        url.includes('aff') ||
        url.includes('go.php'))
    ) {
      console.log('[AdBlocker] Blocked redirect:', url);
      return Promise.reject(new Error('Redirect blocked'));
    }
    return originalFetch.call(window, resource, config);
  } as any;
}

/**
 * Initialize all ad blocking features
 */
export function initializeAdBlocker() {
  blockPopups();
  blockRedirects();

  // Monitor for new ad elements
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            const element = node as HTMLElement;
            const id = element.id || '';
            const className = element.className || '';

            // Remove ad elements
            if (
              id.includes('ad') ||
              className.includes('ad') ||
              id.includes('banner') ||
              className.includes('banner') ||
              id.includes('popup') ||
              className.includes('popup')
            ) {
              const htmlElement = element as HTMLElement;
              if (htmlElement.offsetHeight < 100 || htmlElement.offsetWidth < 100) {
                element.remove();
              }
            }
          }
        });
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  console.log('[AdBlocker] Initialized');
}

/**
 * Get CSP header string
 */
export function getCSPHeader(): string {
  return Object.entries(AD_BLOCKER_CONFIG.cspHeaders)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
}

/**
 * Check if URL is ad-related
 */
export function isAdUrl(url: string): boolean {
  const adKeywords = [
    'ads',
    'analytics',
    'tracking',
    'doubleclick',
    'googlesyndication',
    'adnxs',
    'criteo',
    'popads',
    'popcash',
    'adcash',
    'redirect',
    'exit',
  ];

  return adKeywords.some((keyword) => url.toLowerCase().includes(keyword));
}
