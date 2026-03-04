import { describe, it, expect, beforeEach } from 'vitest';
import { getUpcomingBirthdays, getUpcomingAnniversaries, getTodayCelebrations } from './birthdays';

// ─── Helpers ────────────────────────────────────────────────────────────────

function daysFromToday(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  // Strip time — keep only the date
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function makeEmployee(
  id: string,
  birthdayOffset: number,
  joiningOffset: number,
  joiningYearsAgo = 2,
) {
  const bday = daysFromToday(birthdayOffset);
  const joining = daysFromToday(joiningOffset);
  // Make joining year older by default so first-year filter doesn't kick in
  joining.setFullYear(joining.getFullYear() - joiningYearsAgo + 1);

  return {
    id,
    first_name: `First${id}`,
    last_name: `Last${id}`,
    date_of_birth: new Date(new Date().getFullYear() - 30, bday.getMonth(), bday.getDate()),
    date_of_joining: new Date(
      new Date().getFullYear() - joiningYearsAgo,
      joining.getMonth(),
      joining.getDate(),
    ),
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('getUpcomingBirthdays', () => {
  it('includes employee whose birthday is 10 days from now', () => {
    const employee = makeEmployee('A', 10, 0);
    const results = getUpcomingBirthdays([employee], 30);
    const ids = results.map((r) => r.id);
    expect(ids).toContain('A');
  });

  it('excludes employee whose birthday is 40 days away (outside 30-day window)', () => {
    const employee = makeEmployee('B', 40, 0);
    const results = getUpcomingBirthdays([employee], 30);
    const ids = results.map((r) => r.id);
    expect(ids).not.toContain('B');
  });

  it('handles December-to-January year boundary: birthday on Jan 5 appears when today is Dec 20', () => {
    // Simulate today = Dec 20 of some year
    const today = new Date(2025, 11, 20); // Dec 20 2025
    const janBday = {
      id: 'C',
      first_name: 'FirstC',
      last_name: 'LastC',
      date_of_birth: new Date(1990, 0, 5), // Jan 5 (any year)
      date_of_joining: new Date(2020, 0, 5),
    };
    const results = getUpcomingBirthdays([janBday], 30, today);
    const ids = results.map((r) => r.id);
    expect(ids).toContain('C');
    // Should be 16 days: Dec 20 → Jan 5 is 16 days
    const item = results.find((r) => r.id === 'C');
    expect(item?.daysUntil).toBe(16);
  });

  it("returns daysUntil=0 for today's birthday", () => {
    const today = new Date();
    const employee = {
      id: 'D',
      first_name: 'FirstD',
      last_name: 'LastD',
      date_of_birth: new Date(1990, today.getMonth(), today.getDate()),
      date_of_joining: new Date(2020, 0, 1),
    };
    const results = getUpcomingBirthdays([employee], 30);
    const item = results.find((r) => r.id === 'D');
    expect(item).toBeDefined();
    expect(item?.daysUntil).toBe(0);
  });

  it('returns results sorted by daysUntil ascending', () => {
    const e5 = makeEmployee('E5', 5, 0);
    const e15 = makeEmployee('E15', 15, 0);
    const e1 = makeEmployee('E1', 1, 0);
    const results = getUpcomingBirthdays([e5, e15, e1], 30);
    const days = results.filter(r => ['E5', 'E15', 'E1'].includes(r.id)).map((r) => r.daysUntil);
    expect(days).toEqual([...days].sort((a, b) => a - b));
  });
});

describe('getUpcomingAnniversaries', () => {
  it('includes employee whose work anniversary is in 10 days', () => {
    const today = new Date();
    const annivMonth = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10).getMonth();
    const annivDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10).getDate();
    const employee = {
      id: 'F',
      first_name: 'FirstF',
      last_name: 'LastF',
      date_of_birth: new Date(1990, 0, 1),
      date_of_joining: new Date(today.getFullYear() - 3, annivMonth, annivDay), // 3 years ago
    };
    const results = getUpcomingAnniversaries([employee], 30);
    const ids = results.map((r) => r.id);
    expect(ids).toContain('F');
  });

  it('excludes first-year employees (joined this year)', () => {
    const today = new Date();
    const employee = {
      id: 'G',
      first_name: 'FirstG',
      last_name: 'LastG',
      date_of_birth: new Date(1990, 0, 1),
      date_of_joining: new Date(today.getFullYear(), 0, 15), // joined this year
    };
    const results = getUpcomingAnniversaries([employee], 365);
    const ids = results.map((r) => r.id);
    expect(ids).not.toContain('G');
  });

  it('includes years of service count', () => {
    const today = new Date();
    const employee = {
      id: 'H',
      first_name: 'FirstH',
      last_name: 'LastH',
      date_of_birth: new Date(1990, 0, 1),
      date_of_joining: new Date(today.getFullYear() - 5, today.getMonth(), today.getDate()), // 5 years ago today
    };
    const results = getUpcomingAnniversaries([employee], 30);
    const item = results.find((r) => r.id === 'H');
    expect(item).toBeDefined();
    expect(item?.yearsOfService).toBe(5);
  });
});

describe('getTodayCelebrations', () => {
  it("returns only employees whose birthday or anniversary is exactly today", () => {
    const today = new Date();

    const birthdayEmployee = {
      id: 'I',
      first_name: 'FirstI',
      last_name: 'LastI',
      date_of_birth: new Date(1990, today.getMonth(), today.getDate()),
      date_of_joining: new Date(today.getFullYear() - 3, 0, 1),
    };

    const futureEmployee = {
      id: 'J',
      first_name: 'FirstJ',
      last_name: 'LastJ',
      date_of_birth: new Date(1990, today.getMonth(), today.getDate() + 5),
      date_of_joining: new Date(today.getFullYear() - 3, 0, 1),
    };

    const results = getTodayCelebrations([birthdayEmployee, futureEmployee]);
    const names = results.map((r) => r.name);
    expect(names.some((n) => n.includes('FirstI'))).toBe(true);
    expect(names.some((n) => n.includes('FirstJ'))).toBe(false);
  });

  it('includes anniversary type for anniversary celebrations', () => {
    const today = new Date();

    const anniversaryEmployee = {
      id: 'K',
      first_name: 'FirstK',
      last_name: 'LastK',
      date_of_birth: new Date(1990, 0, 1), // not today
      date_of_joining: new Date(today.getFullYear() - 2, today.getMonth(), today.getDate()),
    };

    const results = getTodayCelebrations([anniversaryEmployee]);
    const annivItem = results.find((r) => r.name.includes('FirstK') && r.type === 'anniversary');
    expect(annivItem).toBeDefined();
    expect(annivItem?.years).toBe(2);
  });
});
