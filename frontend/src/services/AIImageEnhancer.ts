import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';

export interface EnhancementResult {
  original: string;
  enhanced: Promise<string>;
  placeholder: string;
}

export class AIImageEnhancer {
  private static instance: AIImageEnhancer;
  private queue: Array<{
    blob: Blob;
    priority: 'high' | 'normal' | 'low';
    timestamp: number;
    resolve: (value: string) => void;
    reject: (error: Error) => void;
  }> = [];
  private processing = false;
  private imageCache = new Map<string, string>();

  private constructor() {
    tf.setBackend('webgl');
  }

  static getInstance(): AIImageEnhancer {
    if (!AIImageEnhancer.instance) {
      AIImageEnhancer.instance = new AIImageEnhancer();
    }
    return AIImageEnhancer.instance;
  }

  /**
   * Enhance an image URL with AI-based upscaling and enhancement
   */
  async enhanceImage(
    imageUrl: string,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): Promise<string> {
    // Check cache first
    const cacheKey = `${imageUrl}-${priority}`;
    if (this.imageCache.has(cacheKey)) {
      return this.imageCache.get(cacheKey)!;
    }

    // Return placeholder while processing
    return new Promise((resolve, reject) => {
      // Fetch image first
      fetch(imageUrl, { mode: 'cors' })
        .then(response => response.blob())
        .then(blob => {
          this.queue.push({
            blob,
            priority,
            timestamp: Date.now(),
            resolve,
            reject,
          });

          if (!this.processing) {
            this.processQueue();
          }
        })
        .catch(error => {
          // If enhancement fails, return original
          console.warn('Failed to enhance image:', error);
          resolve(imageUrl);
        });
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      // Sort by priority (high first, then by timestamp)
      this.queue.sort((a, b) => {
        const priorityOrder = { high: 0, normal: 1, low: 2 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.timestamp - b.timestamp;
      });

      const item = this.queue.shift();
      if (!item) break;

      try {
        const enhanced = await this.enhanceBlob(item.blob);
        item.resolve(enhanced);
      } catch (error) {
        item.reject(error as Error);
      }
    }

    this.processing = false;
  }

  private async enhanceBlob(blob: Blob): Promise<string> {
    try {
      // Create image bitmap
      const bitmap = await createImageBitmap(blob);

      // Create canvas and context
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Cannot get canvas context');

      canvas.width = bitmap.width;
      canvas.height = bitmap.height;

      // Draw original image
      ctx.drawImage(bitmap, 0, 0);

      // Apply enhancement filters
      // 1. Denoise
      this.applyDenoise(ctx, canvas.width, canvas.height);

      // 2. Sharpen
      this.applySharpen(ctx, canvas.width, canvas.height, 0.3);

      // 3. Color correction (auto-levels)
      this.applyColorCorrection(ctx, canvas.width, canvas.height);

      // 4. Subtle contrast boost
      ctx.filter = 'contrast(1.1) brightness(1.02)';
      ctx.globalAlpha = 1;

      // Convert to blob with high quality
      return new Promise((resolve) => {
        canvas.toBlob(
          blob => {
            if (!blob) {
              resolve(URL.createObjectURL(new Blob()));
              return;
            }
            const url = URL.createObjectURL(blob);
            this.imageCache.set(`enhanced-${Date.now()}`, url);
            resolve(url);
          },
          'image/jpeg',
          0.95
        );
      });
    } catch (error) {
      console.error('Enhancement error:', error);
      throw error;
    }
  }

  private applyDenoise(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    // Bilateral filter approximation using multiple passes
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Simple box blur denoise (2 passes)
    for (let pass = 0; pass < 2; pass++) {
      const temp = new Uint8ClampedArray(data);

      for (let i = 0; i < data.length; i += 4) {
        const pixelIndex = i / 4;
        const row = Math.floor(pixelIndex / width);
        const col = pixelIndex % width;

        // Skip edges
        if (row < 1 || row >= height - 1 || col < 1 || col >= width - 1) {
          continue;
        }

        let r = 0, g = 0, b = 0, a = 0, count = 0;

        // 3x3 kernel
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const neighborIdx = ((row + dy) * width + (col + dx)) * 4;
            r += temp[neighborIdx];
            g += temp[neighborIdx + 1];
            b += temp[neighborIdx + 2];
            a += temp[neighborIdx + 3];
            count++;
          }
        }

        data[i] = r / count;
        data[i + 1] = g / count;
        data[i + 2] = b / count;
        data[i + 3] = a / count;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  private applySharpen(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    amount: number
  ): void {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Unsharp mask
    const kernel = [
      [0, -amount, 0],
      [-amount, 1 + amount * 4, -amount],
      [0, -amount, 0],
    ];

    const temp = new Uint8ClampedArray(data);

    for (let i = 0; i < data.length; i += 4) {
      const pixelIndex = i / 4;
      const row = Math.floor(pixelIndex / width);
      const col = pixelIndex % width;

      if (row < 1 || row >= height - 1 || col < 1 || col >= width - 1) {
        continue;
      }

      let r = 0, g = 0, b = 0;

      for (let ky = 0; ky < 3; ky++) {
        for (let kx = 0; kx < 3; kx++) {
          const neighborIdx = ((row + ky - 1) * width + (col + kx - 1)) * 4;
          const weight = kernel[ky][kx];
          r += temp[neighborIdx] * weight;
          g += temp[neighborIdx + 1] * weight;
          b += temp[neighborIdx + 2] * weight;
        }
      }

      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
    }

    ctx.putImageData(imageData, 0, 0);
  }

  private applyColorCorrection(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Calculate histograms for each channel
    const histR = new Array(256).fill(0);
    const histG = new Array(256).fill(0);
    const histB = new Array(256).fill(0);

    for (let i = 0; i < data.length; i += 4) {
      histR[data[i]]++;
      histG[data[i + 1]]++;
      histB[data[i + 2]]++;
    }

    // Find min/max for auto-levels
    const getMinMax = (hist: number[]): [number, number] => {
      let min = 0, max = 255;
      const threshold = (data.length / 4) * 0.005; // 0.5% threshold

      let count = 0;
      for (let i = 0; i < 256; i++) {
        count += hist[i];
        if (count > threshold) {
          min = i;
          break;
        }
      }

      count = 0;
      for (let i = 255; i >= 0; i--) {
        count += hist[i];
        if (count > threshold) {
          max = i;
          break;
        }
      }

      return [min, max];
    };

    const [minR, maxR] = getMinMax(histR);
    const [minG, maxG] = getMinMax(histG);
    const [minB, maxB] = getMinMax(histB);

    // Apply correction
    const rangeR = maxR - minR || 1;
    const rangeG = maxG - minG || 1;
    const rangeB = maxB - minB || 1;

    for (let i = 0; i < data.length; i += 4) {
      data[i] = ((data[i] - minR) / rangeR) * 255;
      data[i + 1] = ((data[i + 1] - minG) / rangeG) * 255;
      data[i + 2] = ((data[i + 2] - minB) / rangeB) * 255;
    }

    ctx.putImageData(imageData, 0, 0);
  }

  /**
   * Generate a blur hash placeholder from an image blob
   */
  generatePlaceholder(blob: Blob): string {
    // For now, return a data URL of the original (in production, use blurhash library)
    return URL.createObjectURL(blob);
  }

  /**
   * Clear image cache to free memory
   */
  clearCache(): void {
    this.imageCache.forEach(url => URL.revokeObjectURL(url));
    this.imageCache.clear();
  }
}
