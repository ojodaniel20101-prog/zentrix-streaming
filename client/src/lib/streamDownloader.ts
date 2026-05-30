/**
 * Stream Downloader Utility
 * Downloads HLS/DASH streams from VidSrc and MegaPlay
 */

export interface DownloadProgress {
  loaded: number;
  total: number;
  percentage: number;
  speed: number; // bytes per second
  eta: number; // seconds remaining
}

export interface DownloadOptions {
  title: string;
  quality?: 'auto' | '720p' | '1080p' | '480p';
  format?: 'mp4' | 'mkv';
  language?: 'sub' | 'dub'; // for anime
  onProgress?: (progress: DownloadProgress) => void;
}

/**
 * Extract HLS stream URL from VidSrc iframe
 */
export async function extractVidSrcStream(iframeUrl: string): Promise<string | null> {
  try {
    const response = await fetch(iframeUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const html = await response.text();

    // Extract m3u8 URL from various patterns
    const patterns = [
      /src:\s*["']([^"']*\.m3u8[^"']*)/gi,
      /file:\s*["']([^"']*\.m3u8[^"']*)/gi,
      /url:\s*["']([^"']*\.m3u8[^"']*)/gi,
      /"([^"]*\.m3u8[^"]*)"/gi,
      /'([^']*\.m3u8[^']*)'/gi,
    ];

    for (const pattern of patterns) {
      const match = pattern.exec(html);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  } catch (error) {
    console.error('[StreamDownloader] Error extracting VidSrc stream:', error);
    return null;
  }
}

/**
 * Extract DASH stream URL from MegaPlay
 */
export async function extractMegaPlayStream(iframeUrl: string): Promise<string | null> {
  try {
    const response = await fetch(iframeUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const html = await response.text();

    // Extract mpd URL (DASH manifest)
    const patterns = [
      /src:\s*["']([^"']*\.mpd[^"']*)/gi,
      /file:\s*["']([^"']*\.mpd[^"']*)/gi,
      /url:\s*["']([^"']*\.mpd[^"']*)/gi,
      /"([^"]*\.mpd[^"]*)"/gi,
      /'([^']*\.mpd[^']*)'/gi,
    ];

    for (const pattern of patterns) {
      const match = pattern.exec(html);
      if (match && match[1]) {
        return match[1];
      }
    }

    // Fallback: look for m3u8
    return await extractVidSrcStream(iframeUrl);
  } catch (error) {
    console.error('[StreamDownloader] Error extracting MegaPlay stream:', error);
    return null;
  }
}

/**
 * Download HLS stream segments
 */
export async function downloadHLSStream(
  m3u8Url: string,
  options: DownloadOptions
): Promise<Blob> {
  try {
    const response = await fetch(m3u8Url);
    const m3u8Content = await response.text();

    // Parse m3u8 playlist
    const lines = m3u8Content.split('\n');
    const segments: string[] = [];
    let baseUrl = m3u8Url.substring(0, m3u8Url.lastIndexOf('/') + 1);

    for (const line of lines) {
      if (line && !line.startsWith('#')) {
        const segmentUrl = line.startsWith('http') ? line : baseUrl + line;
        segments.push(segmentUrl);
      }
    }

    // Download segments
    const chunks: Uint8Array[] = [];
    let downloaded = 0;
    const total = segments.length;
    const startTime = Date.now();

    for (let i = 0; i < segments.length; i++) {
      const segmentResponse = await fetch(segments[i]);
      const chunk = await segmentResponse.arrayBuffer();
      chunks.push(new Uint8Array(chunk));

      downloaded++;
      const elapsed = (Date.now() - startTime) / 1000;
      const speed = (downloaded * 1024 * 1024) / elapsed; // bytes per second (assuming 1MB per segment)
      const eta = ((total - downloaded) * 1024 * 1024) / speed;

      options.onProgress?.({
        loaded: downloaded,
        total,
        percentage: (downloaded / total) * 100,
        speed,
        eta: Math.round(eta),
      });
    }

    // Combine chunks into single blob
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const combined = new Uint8Array(totalSize);
    let offset = 0;

    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    return new Blob([combined], { type: 'video/mp4' });
  } catch (error) {
    console.error('[StreamDownloader] Error downloading HLS stream:', error);
    throw error;
  }
}

/**
 * Download DASH stream
 */
export async function downloadDASHStream(
  mpdUrl: string,
  options: DownloadOptions
): Promise<Blob> {
  try {
    const response = await fetch(mpdUrl);
    const mpdContent = await response.text();

    // Parse MPD (DASH manifest)
    const parser = new DOMParser();
    const mpd = parser.parseFromString(mpdContent, 'text/xml');

    // Extract representation URLs
    const representations = mpd.querySelectorAll('Representation');
    let selectedRep: Element | null = null;

    // Select quality based on options
    for (const rep of Array.from(representations)) {
      const bandwidth = rep.getAttribute('bandwidth');
      const height = rep.getAttribute('height');

      if (options.quality === '1080p' && height === '1080') {
        selectedRep = rep;
        break;
      } else if (options.quality === '720p' && height === '720') {
        selectedRep = rep;
        break;
      } else if (options.quality === '480p' && height === '480') {
        selectedRep = rep;
        break;
      }
    }

    if (!selectedRep) {
      selectedRep = representations[representations.length - 1];
    }

    // Extract segment URLs
    const baseUrl = mpdUrl.substring(0, mpdUrl.lastIndexOf('/') + 1);
    const segmentList = selectedRep?.querySelector('SegmentList');
    const segments: string[] = [];

    if (segmentList) {
      const segmentUrls = segmentList.querySelectorAll('SegmentURL');
      Array.from(segmentUrls).forEach((segmentUrl) => {
        const media = segmentUrl.getAttribute('media');
        if (media) {
          segments.push(baseUrl + media);
        }
      });
    }

    // Download segments
    const chunks: Uint8Array[] = [];
    let downloaded = 0;
    const total = segments.length;
    const startTime = Date.now();

    for (const segmentUrl of segments) {
      const segmentResponse = await fetch(segmentUrl);
      const chunk = await segmentResponse.arrayBuffer();
      chunks.push(new Uint8Array(chunk));

      downloaded++;
      const elapsed = (Date.now() - startTime) / 1000;
      const speed = (downloaded * 1024 * 1024) / elapsed;
      const eta = ((total - downloaded) * 1024 * 1024) / speed;

      options.onProgress?.({
        loaded: downloaded,
        total,
        percentage: (downloaded / total) * 100,
        speed,
        eta: Math.round(eta),
      });
    }

    // Combine chunks
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const combined = new Uint8Array(totalSize);
    let offset = 0;

    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    return new Blob([combined], { type: 'video/mp4' });
  } catch (error) {
    console.error('[StreamDownloader] Error downloading DASH stream:', error);
    throw error;
  }
}

/**
 * Trigger browser download
 */
export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download stream with progress tracking
 */
export async function downloadStream(
  streamUrl: string,
  options: DownloadOptions
): Promise<void> {
  try {
    let blob: Blob;

    if (streamUrl.includes('.m3u8')) {
      blob = await downloadHLSStream(streamUrl, options);
    } else if (streamUrl.includes('.mpd')) {
      blob = await downloadDASHStream(streamUrl, options);
    } else {
      throw new Error('Unsupported stream format');
    }

    const filename = `${options.title}.${options.format || 'mp4'}`;
    triggerDownload(blob, filename);
  } catch (error) {
    console.error('[StreamDownloader] Download failed:', error);
    throw error;
  }
}

/**
 * Get download size estimate
 */
export async function estimateDownloadSize(streamUrl: string): Promise<number> {
  try {
    const response = await fetch(streamUrl, { method: 'HEAD' });
    const contentLength = response.headers.get('content-length');
    return contentLength ? parseInt(contentLength) : 0;
  } catch (error) {
    console.error('[StreamDownloader] Error estimating size:', error);
    return 0;
  }
}
