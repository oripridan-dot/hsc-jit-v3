/**
 * Image Optimization Utilities
 * Lazy loading, responsive images, and performance optimization
 */

const standardSizes = [320, 640, 1024, 1280, 1536, 1920, 2560];

/**
 * Generate srcset for responsive images
 */
export function generateImageSrcSet(baseUrl: string, sizes: number[] = standardSizes): string {
  return sizes.map((size) => `${baseUrl}?w=${size} ${size}w`).join(', ');
}

/**
 * Get optimal image size based on container width
 */
export function getOptimalImageSize(containerWidth: number): number {
  const optimalSize = standardSizes.find((size) => size >= containerWidth * window.devicePixelRatio);
  return optimalSize || standardSizes[standardSizes.length - 1];
}

/**
 * Preload image
 */
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to preload image: ${url}`));
    img.src = url;
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
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpg' | 'png';
  } = {}
): string {
  const params = new URLSearchParams();

  if (options.width) params.append('w', String(options.width));
  if (options.height) params.append('h', String(options.height));
  if (options.quality) params.append('q', String(options.quality));
  if (options.format) params.append('f', options.format);

  const separator = url.includes('?') ? '&' : '?';
  return params.toString() ? `${url}${separator}${params.toString()}` : url;
}

/**
 * Check WebP support
 */
export function supportsWebP(): boolean {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  return canvas.toDataURL('image/webp').includes('webp');
}

/**
 * Get best image format
 */
export function getBestImageFormat(): 'webp' | 'jpg' {
  return supportsWebP() ? 'webp' : 'jpg';
}

/**
 * Generate thumbnail URL
 */
export function generateThumbnailUrl(url: string, size: number = 200): string {
  return optimizeImageUrl(url, {
    width: size,
    height: size,
    quality: 80,
    format: getBestImageFormat(),
  });
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
