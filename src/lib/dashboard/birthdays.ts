/**
 * Birthday and work anniversary query utilities.
 *
 * All functions are pure (no Prisma dependency) — they accept employee arrays
 * so they can be tested without a database.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface EmployeeDateInfo {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: Date;
  date_of_joining: Date;
}

export interface UpcomingBirthday {
  id: string;
  name: string;
  /** This year's (or next year's if already passed) birthday date */
  date: Date;
  /** 0 = today, positive = days until */
  daysUntil: number;
}

export interface UpcomingAnniversary {
  id: string;
  name: string;
  /** This year's (or next year's if already passed) anniversary date */
  date: Date;
  daysUntil: number;
  yearsOfService: number;
}

export interface TodayCelebration {
  name: string;
  type: 'birthday' | 'anniversary';
  /** Only set for anniversary type */
  years?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Compute days between two dates (floor of difference in ms).
 * Returns a non-negative integer when `target >= reference`.
 */
function daysDiff(reference: Date, target: Date): number {
  const refMs = Date.UTC(reference.getFullYear(), reference.getMonth(), reference.getDate());
  const targetMs = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.round((targetMs - refMs) / (1000 * 60 * 60 * 24));
}

/**
 * Given a month/day, find the next occurrence on or after `today`.
 * If the date has already passed this year, return next year's occurrence.
 */
function nextOccurrence(month: number, day: number, today: Date): Date {
  const thisYear = new Date(today.getFullYear(), month, day);
  if (daysDiff(today, thisYear) >= 0) {
    return thisYear;
  }
  return new Date(today.getFullYear() + 1, month, day);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns employees whose birthday (month+day) falls within `windowDays` days
 * from today (inclusive). Handles December-to-January year boundary.
 *
 * @param employees  Array of employees with date_of_birth
 * @param windowDays Number of days to look ahead (default 30)
 * @param today      Override today's date (useful for testing)
 */
export function getUpcomingBirthdays(
  employees: EmployeeDateInfo[],
  windowDays = 30,
  today: Date = new Date(),
): UpcomingBirthday[] {
  const todayNorm = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const results: UpcomingBirthday[] = [];

  for (const emp of employees) {
    const bday = emp.date_of_birth;
    const occurrence = nextOccurrence(bday.getMonth(), bday.getDate(), todayNorm);
    const daysUntil = daysDiff(todayNorm, occurrence);

    if (daysUntil >= 0 && daysUntil <= windowDays) {
      results.push({
        id: emp.id,
        name: `${emp.first_name} ${emp.last_name}`,
        date: occurrence,
        daysUntil,
      });
    }
  }

  return results.sort((a, b) => a.daysUntil - b.daysUntil);
}

/**
 * Returns employees whose work anniversary (month+day of date_of_joining) falls
 * within `windowDays` days from today. First-year employees (joined this calendar
 * year) are excluded.
 *
 * @param employees  Array of employees with date_of_joining
 * @param windowDays Number of days to look ahead (default 30)
 * @param today      Override today's date (useful for testing)
 */
export function getUpcomingAnniversaries(
  employees: EmployeeDateInfo[],
  windowDays = 30,
  today: Date = new Date(),
): UpcomingAnniversary[] {
  const todayNorm = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const currentYear = todayNorm.getFullYear();

  const results: UpcomingAnniversary[] = [];

  for (const emp of employees) {
    const joining = emp.date_of_joining;

    // Exclude first-year employees (joined in current calendar year)
    if (joining.getFullYear() === currentYear) {
      continue;
    }

    const occurrence = nextOccurrence(joining.getMonth(), joining.getDate(), todayNorm);
    const daysUntil = daysDiff(todayNorm, occurrence);

    if (daysUntil >= 0 && daysUntil <= windowDays) {
      // Years of service = anniversary year - joining year
      const anniversaryYear = occurrence.getFullYear();
      const yearsOfService = anniversaryYear - joining.getFullYear();

      results.push({
        id: emp.id,
        name: `${emp.first_name} ${emp.last_name}`,
        date: occurrence,
        daysUntil,
        yearsOfService,
      });
    }
  }

  return results.sort((a, b) => a.daysUntil - b.daysUntil);
}

/**
 * Returns all employees whose birthday or work anniversary is exactly today.
 * First-year employees are excluded from anniversary checks (same rule as
 * getUpcomingAnniversaries).
 */
export function getTodayCelebrations(
  employees: EmployeeDateInfo[],
  today: Date = new Date(),
): TodayCelebration[] {
  const birthdays = getUpcomingBirthdays(employees, 0, today).filter((b) => b.daysUntil === 0);
  const anniversaries = getUpcomingAnniversaries(employees, 0, today).filter(
    (a) => a.daysUntil === 0,
  );

  const celebrations: TodayCelebration[] = [
    ...birthdays.map((b) => ({ name: b.name, type: 'birthday' as const })),
    ...anniversaries.map((a) => ({ name: a.name, type: 'anniversary' as const, years: a.yearsOfService })),
  ];

  return celebrations;
}
