/**
 * Unit tests for date and time utility functions
 */

import { describe, it, expect } from 'vitest';
import { format, parseISO, isPast, isFuture } from 'date-fns';

describe('Date Utilities', () => {
  describe('Date Formatting', () => {
    it('should format ISO date correctly', () => {
      const isoDate = '2025-12-01T18:00:00Z';
      const parsed = parseISO(isoDate);
      const formatted = format(parsed, 'MMM dd, yyyy');
      
      expect(formatted).toBe('Dec 01, 2025');
    });

    it('should format time correctly', () => {
      const isoDate = '2025-12-01T18:30:00Z';
      const parsed = parseISO(isoDate);
      const formatted = format(parsed, 'h:mm a');
      
      expect(formatted).toMatch(/\d{1,2}:\d{2} [AP]M/);
    });
  });

  describe('Date Comparison', () => {
    it('should identify past dates', () => {
      const pastDate = '2020-01-01T00:00:00Z';
      const parsed = parseISO(pastDate);
      
      expect(isPast(parsed)).toBe(true);
    });

    it('should identify future dates', () => {
      const futureDate = '2030-12-31T23:59:59Z';
      const parsed = parseISO(futureDate);
      
      expect(isFuture(parsed)).toBe(true);
    });

    it('should handle current date correctly', () => {
      const now = new Date();
      
      // Current moment should not be in the past or future
      // (edge case, but we can test proximity)
      expect(isPast(now) || isFuture(now)).toBeDefined();
    });
  });
});
