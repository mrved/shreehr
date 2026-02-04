import { describe, expect, it } from "vitest";
import {
  calculateEMI,
  calculateEndDate,
  calculateTotalInterest,
  generateAmortizationSchedule,
} from "./loan";

describe("Loan EMI Calculation", () => {
  it("calculates EMI correctly for Rs.100,000 @ 12% for 12 months", () => {
    const params = {
      principalPaise: 10000000, // Rs.100,000
      annualInterestRate: 12,
      tenureMonths: 12,
    };

    const emi = calculateEMI(params);

    // Expected EMI: ~Rs.8,885 (888,457 paise)
    // Using standard EMI formula verification
    expect(emi).toBeGreaterThan(888000);
    expect(emi).toBeLessThan(889000);
  });

  it("calculates EMI correctly for zero interest loan", () => {
    const params = {
      principalPaise: 5000000, // Rs.50,000
      annualInterestRate: 0,
      tenureMonths: 10,
    };

    const emi = calculateEMI(params);

    // Expected EMI: Rs.5,000 exactly (500,000 paise)
    expect(emi).toBe(500000);
  });

  it("generates schedule where total equals principal + interest", () => {
    const params = {
      principalPaise: 10000000, // Rs.100,000
      annualInterestRate: 12,
      tenureMonths: 12,
    };

    const schedule = generateAmortizationSchedule(params);
    const totalInterest = calculateTotalInterest(params);

    // Sum all EMI payments
    const totalPaid = schedule.reduce((sum, entry) => sum + entry.emiPaise, 0);

    // Total should equal principal + interest (within 1 paise tolerance for rounding)
    const expected = params.principalPaise + totalInterest;
    expect(Math.abs(totalPaid - expected)).toBeLessThanOrEqual(1);
  });

  it("generates schedule where final balance is zero", () => {
    const params = {
      principalPaise: 10000000, // Rs.100,000
      annualInterestRate: 12,
      tenureMonths: 12,
    };

    const schedule = generateAmortizationSchedule(params);

    // Last entry should have zero balance
    const lastEntry = schedule[schedule.length - 1];
    expect(lastEntry.balanceAfterPaise).toBe(0);
  });

  it("generates schedule where each EMI equals principal + interest", () => {
    const params = {
      principalPaise: 10000000, // Rs.100,000
      annualInterestRate: 12,
      tenureMonths: 12,
    };

    const schedule = generateAmortizationSchedule(params);

    // For each entry, EMI should equal principal + interest
    schedule.forEach((entry) => {
      expect(entry.emiPaise).toBe(entry.principalPaise + entry.interestPaise);
    });
  });

  it("generates schedule with correct number of entries", () => {
    const params = {
      principalPaise: 10000000,
      annualInterestRate: 12,
      tenureMonths: 12,
    };

    const schedule = generateAmortizationSchedule(params);

    expect(schedule.length).toBe(12);
  });

  it("generates schedule with decreasing interest and increasing principal", () => {
    const params = {
      principalPaise: 10000000,
      annualInterestRate: 12,
      tenureMonths: 12,
    };

    const schedule = generateAmortizationSchedule(params);

    // Interest should decrease month over month (reducing balance)
    for (let i = 1; i < schedule.length; i++) {
      expect(schedule[i].interestPaise).toBeLessThanOrEqual(schedule[i - 1].interestPaise);
    }

    // Principal should increase month over month
    for (let i = 1; i < schedule.length - 1; i++) {
      // Skip last month as it's adjusted
      expect(schedule[i].principalPaise).toBeGreaterThanOrEqual(schedule[i - 1].principalPaise);
    }
  });

  it("calculates end date correctly", () => {
    const startDate = new Date("2026-02-01");
    const tenureMonths = 12;

    const endDate = calculateEndDate(startDate, tenureMonths);

    expect(endDate.getFullYear()).toBe(2027);
    expect(endDate.getMonth()).toBe(1); // February (0-indexed)
    expect(endDate.getDate()).toBe(1);
  });

  it("calculates total interest correctly", () => {
    const params = {
      principalPaise: 10000000,
      annualInterestRate: 12,
      tenureMonths: 12,
    };

    const totalInterest = calculateTotalInterest(params);
    const schedule = generateAmortizationSchedule(params);

    // Sum interest from schedule
    const scheduleInterest = schedule.reduce((sum, entry) => sum + entry.interestPaise, 0);

    // Should match (within rounding tolerance)
    expect(Math.abs(totalInterest - scheduleInterest)).toBeLessThanOrEqual(1);
  });
});
