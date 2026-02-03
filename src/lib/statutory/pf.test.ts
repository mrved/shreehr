import { describe, it, expect } from 'vitest';
import {
  calculatePF,
  calculateEmployerPFBreakdown,
  PF_WAGE_CEILING_PAISE,
  EPS_MAX_MONTHLY_PAISE,
} from './pf';

describe('PF Calculation', () => {
  describe('calculatePF', () => {
    it('should calculate 12% employee PF for basic under ceiling', () => {
      // Basic: Rs.12,000 = 1,200,000 paise
      const result = calculatePF(1200000);
      expect(result.employeePF).toBe(144000); // 12% of 12,000 = 1,440
      expect(result.pfBase).toBe(1200000);
    });

    it('should cap PF at wage ceiling for high basic', () => {
      // Basic: Rs.25,000 = 2,500,000 paise
      // PF base should be capped at Rs.15,000
      const result = calculatePF(2500000);
      expect(result.pfBase).toBe(1500000); // Rs.15,000
      expect(result.employeePF).toBe(180000); // 12% of 15,000 = 1,800
    });

    it('should handle exact wage ceiling amount', () => {
      const result = calculatePF(1500000); // Rs.15,000 exactly
      expect(result.pfBase).toBe(1500000);
      expect(result.employeePF).toBe(180000);
    });

    it('should handle zero basic', () => {
      const result = calculatePF(0);
      expect(result.employeePF).toBe(0);
      expect(result.pfBase).toBe(0);
    });

    it('should include employer breakdown in result', () => {
      const result = calculatePF(1200000);
      expect(result.breakdown).toBeDefined();
      expect(result.breakdown.epf).toBeGreaterThan(0);
      expect(result.breakdown.eps).toBeGreaterThan(0);
      expect(result.breakdown.edli).toBeGreaterThan(0);
      expect(result.employerTotal).toBeGreaterThan(0);
    });
  });

  describe('calculateEmployerPFBreakdown', () => {
    it('should correctly split employer contribution for basic under ceiling', () => {
      // Basic: Rs.12,000 = 1,200,000 paise
      const result = calculateEmployerPFBreakdown(1200000);

      // 3.67% EPF
      expect(result.epf).toBe(44040); // 3.67% of 12,000 = 440.40

      // 8.33% EPS (not capped because 8.33% of 12,000 = 999.60 < 1,250)
      expect(result.eps).toBe(99960); // 8.33% of 12,000 = 999.60

      // 0.50% EDLI
      expect(result.edli).toBe(6000); // 0.50% of 12,000 = 60

      // 0.51% admin charges
      expect(result.adminCharges).toBe(6120); // 0.51% of 12,000 = 61.20

      // Total
      expect(result.total).toBeGreaterThan(0);
    });

    it('should calculate correctly for high basic (wage ceiling applies)', () => {
      // Basic: Rs.25,000 = 2,500,000 paise
      // PF base is capped at Rs.15,000 = 1,500,000 paise
      const result = calculateEmployerPFBreakdown(2500000);

      // With Rs.15,000 PF base:
      // EPS = 8.33% of 15,000 = 124,950 paise (Rs.1,249.50)
      // This is actually below the Rs.1,250 cap!
      expect(result.eps).toBe(124950);

      // EPF = 3.67% of 15,000 = 55,050 paise (Rs.550.50)
      expect(result.epf).toBe(55050);

      // EDLI = 0.50% of 15,000 = 7,500 paise (Rs.75)
      expect(result.edli).toBe(7500);
    });

    it('should handle exact wage ceiling amount', () => {
      // Basic: Rs.15,000 = 1,500,000 paise
      const result = calculateEmployerPFBreakdown(1500000);

      // 8.33% of 15,000 = 1,249.50 < 1,250, so not capped
      expect(result.eps).toBe(124950); // 8.33% of 15,000 = 1,249.50
      expect(result.epf).toBe(55050); // 3.67% of 15,000 = 550.50
      expect(result.edli).toBe(7500); // 0.50% of 15,000 = 75
    });

    it('should return all zero for zero basic', () => {
      const result = calculateEmployerPFBreakdown(0);
      expect(result.epf).toBe(0);
      expect(result.eps).toBe(0);
      expect(result.edli).toBe(0);
      expect(result.adminCharges).toBe(0);
      expect(result.total).toBe(0);
    });

    it('should ensure total matches sum of components', () => {
      const result = calculateEmployerPFBreakdown(1200000);
      const sum = result.epf + result.eps + result.edli + result.adminCharges;
      expect(result.total).toBe(sum);
    });
  });

  describe('constants', () => {
    it('should export correct PF wage ceiling', () => {
      expect(PF_WAGE_CEILING_PAISE).toBe(1500000); // Rs.15,000
    });

    it('should export correct EPS max monthly', () => {
      expect(EPS_MAX_MONTHLY_PAISE).toBe(125000); // Rs.1,250
    });
  });
});
