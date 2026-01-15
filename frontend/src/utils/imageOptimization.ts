/**
 * Image Optimization Utilities
 * Uses backend image optimization service for compression and lazy loading
 */

type ImagePreset = 'thumbnail' | 'medium' | 'large' | 'original';

/**
 * Get optimized image URL from backend optimization service
 */
export function getOptimizedImageUrl(
  imageUrl: string,
  preset: ImagePreset = 'medium'
): string {
  if (!imageUrl) return '';

  // If it's already an optimization endpoint call, return as-is
  if (imageUrl.includes('/api/images/optimize/')) {
    return imageUrl;
  }

  // For external URLs (http:// or https://), return as-is
  // We can't optimize external images through our service
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // For local images (relative paths or just filenames)
  // Extract filename from path
  const filename = imageUrl.split('/').pop() || '';

  // Use backend optimization endpoint
  return `/api/images/optimize/${filename}?preset=${preset}`;
}

/**
 * Preload optimized image
 */
export function preloadImage(url: string, preset: ImagePreset = 'medium'): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const optimizedUrl = getOptimizedImageUrl(url, preset);

    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to preload image: ${url}`));
    img.src = optimizedUrl;
  });
}

/**
 * Lazy load image with Intersection Observer
 */
export function lazyLoadImage(
  element: HTMLImageElement,
  options?: {
    rootMargin?: string;
    threshold?: number | number[];
  }
): () => void {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.getAttribute('data-src');

          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            observer.unobserve(img);
          }
        }
      });
    },
    {
      rootMargin: options?.rootMargin || '50px',
      threshold: options?.threshold || 0,
    }
  );

  observer.observe(element);

  // Return cleanup function
  return () => observer.unobserve(element);
}

/**
 * Get image URL with optimization parameters
 */
export function optimizeImageUrl(
  url: string,
  options: {
    preset?: ImagePreset;
  } = {}
): string {
  return getOptimizedImageUrl(url, options.preset || 'medium');
}

/**
 * Check WebP support (always true since backend converts to WebP)
 */
export function supportsWebP(): boolean {
  return true;
}

/**
 * Get best image format (always WebP since backend handles conversion)
 */
export function getBestImageFormat(): 'webp' {
  return 'webp';
}

/**
 * Generate thumbnail URL
 */
export function generateThumbnailUrl(url: string): string {
  return getOptimizedImageUrl(url, 'thumbnail');
}

/**
 * Batch preload images
 */
export async function preloadImages(urls: string[]): Promise<void[]> {
  return Promise.all(urls.map((url) => preloadImage(url).catch(() => undefined)));
}

/**
 * Create image blur placeholder
 */
export function createBlurPlaceholder(color: string = '#1f293a'): string {
  const canvas = document.createElement('canvas');
  canvas.width = 10;
  canvas.height = 10;

  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 10, 10);
  }

  return canvas.toDataURL('image/png');
}

/**
 * Image error handler
 */
export function handleImageError(
  element: HTMLImageElement,
  fallbackUrl?: string
): void {
  element.src =
    fallbackUrl ||
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23334155" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="system-ui" font-size="16" fill="%23cbd5e1"%3EImage not found%3C/text%3E%3C/svg%3E';
  element.style.opacity = '0.5';
}

/**
 * Generate srcSet for responsive images
 */
function generateImageSrcSet(src: string): string {
  // Generate srcSet with different presets
  const presets: ImagePreset[] = ['thumbnail', 'medium', 'large'];
  return presets
    .map((preset, index) => {
      const width = [150, 600, 1200][index];
      return `${getOptimizedImageUrl(src, preset)} ${width}w`;
    })
    .join(', ');
}

/**
 * Responsive image component helper
 */
export interface ResponsiveImageOptions {
  src: string;
  alt: string;
  sizes?: string;
  loading?: 'lazy' | 'eager';
  onError?: (e: Event) => void;
  className?: string;
}

/**
 * Get responsive image attributes
 */
export function getResponsiveImageAttrs(options: ResponsiveImageOptions) {
  return {
    src: options.src,
    alt: options.alt,
    srcSet: generateImageSrcSet(options.src),
    sizes: options.sizes || '(min-width: 1280px) 20vw, (min-width: 768px) 33vw, 100vw',
    loading: options.loading || 'lazy',
    onError: options.onError,
    className: options.className,
  };
}

/**
 * Cache invalidation helper
 */
export function addCacheBreaker(url: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}t=${Date.now()}`;
}

/**
 * Get image dimensions
 */
export async function getImageDimensions(
  url: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      reject(new Error(`Failed to load image: ${url}`));
    };
    img.src = url;
  });
}
