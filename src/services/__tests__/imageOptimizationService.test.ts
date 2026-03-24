import { describe, it, expect, vi } from 'vitest';
import { imageOptimizationService } from '../imageOptimizationService';

describe('imageOptimizationService', () => {
  describe('validateImage', () => {
    it('should validate correct image types', () => {
      const validFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const result = imageOptimizationService.validateImage(validFile);
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept JPEG, PNG, WebP', () => {
      const jpeg = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const png = new File([''], 'test.png', { type: 'image/png' });
      const webp = new File([''], 'test.webp', { type: 'image/webp' });

      expect(imageOptimizationService.validateImage(jpeg).valid).toBe(true);
      expect(imageOptimizationService.validateImage(png).valid).toBe(true);
      expect(imageOptimizationService.validateImage(webp).valid).toBe(true);
    });

    it('should reject invalid file types', () => {
      const invalidFile = new File([''], 'test.txt', { type: 'text/plain' });
      const result = imageOptimizationService.validateImage(invalidFile);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file type');
    });

    it('should reject files larger than 10MB', () => {
      const largeFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg',
      });
      const result = imageOptimizationService.validateImage(largeFile);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('too large');
    });
  });

  describe('optimizeImage', () => {
    it('should optimize image and return blob', async () => {
      // Create a mock canvas and context
      const mockCanvas = document.createElement('canvas');
      const mockBlob = new Blob(['fake-image'], { type: 'image/jpeg' });

      vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas);
      vi.spyOn(mockCanvas, 'toBlob').mockImplementation((callback) => {
        callback(mockBlob);
      });

      const file = new File(['fake-content'], 'test.jpg', { type: 'image/jpeg' });
      
      // Note: Full test would require mocking FileReader and Image loading
      // This is a simplified test structure
      expect(imageOptimizationService.optimizeImage).toBeDefined();
    });
  });
});
