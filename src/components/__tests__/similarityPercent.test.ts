import { describe, it, expect } from 'vitest';

// Test the similarity percent calculation formula
function calculateSimilarityPercent(score: number): number {
  return Math.min(100, Math.max(0, Math.round((1 - score) * 50)));
}

describe('Similarity Percent Calculation', () => {
  it('should return 100% for score = -1 (identical)', () => {
    expect(calculateSimilarityPercent(-1)).toBe(100);
  });

  it('should return 50% for score = 0 (no similarity)', () => {
    expect(calculateSimilarityPercent(0)).toBe(50);
  });

  it('should return 0% for score = +1 (opposite)', () => {
    expect(calculateSimilarityPercent(1)).toBe(0);
  });

  it('should clamp to 100% for score = -1.2 (below minimum)', () => {
    expect(calculateSimilarityPercent(-1.2)).toBe(100);
  });

  it('should clamp to 0% for score = 1.2 (above maximum)', () => {
    expect(calculateSimilarityPercent(1.2)).toBe(0);
  });

  it('should handle edge cases correctly', () => {
    // Test some intermediate values
    expect(calculateSimilarityPercent(-0.5)).toBe(75); // (1 - (-0.5)) * 50 = 75
    expect(calculateSimilarityPercent(0.5)).toBe(25);  // (1 - 0.5) * 50 = 25
    expect(calculateSimilarityPercent(-0.8)).toBe(90); // (1 - (-0.8)) * 50 = 90
    expect(calculateSimilarityPercent(0.2)).toBe(40);  // (1 - 0.2) * 50 = 40
  });

  it('should always return values between 0 and 100', () => {
    // Test a range of values
    for (let score = -2; score <= 2; score += 0.1) {
      const result = calculateSimilarityPercent(score);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100);
    }
  });
});
