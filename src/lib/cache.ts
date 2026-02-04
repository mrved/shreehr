import { unstable_cache } from 'next/cache';
import { revalidateTag } from 'next/cache';
import { prisma } from './db';

// Reference data - cache for 1 hour (simple lists for dropdowns)
export const getCachedDepartments = unstable_cache(
  () => prisma.department.findMany({ 
    where: { is_active: true },
    orderBy: { name: 'asc' }
  }),
  ['departments-active'],
  { revalidate: 3600, tags: ['departments'] }
);

export const getCachedDesignations = unstable_cache(
  () => prisma.designation.findMany({
    where: { is_active: true },
    orderBy: { title: 'asc' }
  }),
  ['designations-active'],
  { revalidate: 3600, tags: ['designations'] }
);

export const getCachedLeaveTypes = unstable_cache(
  () => prisma.leaveType.findMany({
    where: { is_active: true },
    orderBy: { name: 'asc' }
  }),
  ['leave-types-active'],
  { revalidate: 900, tags: ['leave-types'] }
);

// All leave types (including inactive) - for admin management
export const getCachedAllLeaveTypes = unstable_cache(
  () => prisma.leaveType.findMany({
    orderBy: { name: 'asc' }
  }),
  ['leave-types-all'],
  { revalidate: 900, tags: ['leave-types'] }
);

// Reference data with counts - for admin list pages (15 min TTL - counts change more often)
export const getCachedDepartmentsWithCounts = unstable_cache(
  () => prisma.department.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { employees: true } },
    },
  }),
  ['departments-with-counts'],
  { revalidate: 900, tags: ['departments'] }
);

export const getCachedDesignationsWithCounts = unstable_cache(
  () => prisma.designation.findMany({
    orderBy: [{ level: 'asc' }, { title: 'asc' }],
    include: {
      _count: { select: { employees: true } },
    },
  }),
  ['designations-with-counts'],
  { revalidate: 900, tags: ['designations'] }
);

// Dashboard counts - cache for 5 minutes
export const getCachedDashboardCounts = unstable_cache(
  async () => {
    const [employees, departments, documents] = await Promise.all([
      prisma.employee.count({ where: { employment_status: 'ACTIVE' }}),
      prisma.department.count({ where: { is_active: true }}),
      prisma.document.count({ where: { is_deleted: false }}),
    ]);
    return { employees, departments, documents };
  },
  ['dashboard-counts'],
  { revalidate: 300, tags: ['dashboard'] }
);

// Cache invalidation helpers
// Next.js 16+ requires a profile/expire config as second argument
const INVALIDATE_NOW = { expire: 0 };

export function invalidateDepartments() {
  revalidateTag('departments', INVALIDATE_NOW);
  revalidateTag('dashboard', INVALIDATE_NOW);
}

export function invalidateDesignations() {
  revalidateTag('designations', INVALIDATE_NOW);
}

export function invalidateLeaveTypes() {
  revalidateTag('leave-types', INVALIDATE_NOW);
}

export function invalidateDashboard() {
  revalidateTag('dashboard', INVALIDATE_NOW);
}

export function invalidateEmployees() {
  revalidateTag('employees', INVALIDATE_NOW);
  revalidateTag('dashboard', INVALIDATE_NOW);
}

export function invalidateDocuments() {
  revalidateTag('documents', INVALIDATE_NOW);
  revalidateTag('dashboard', INVALIDATE_NOW);
}

export function invalidatePTSlabs() {
  revalidateTag('pt-slabs', INVALIDATE_NOW);
}

export function invalidateExpensePolicies() {
  revalidateTag('expense-policies', INVALIDATE_NOW);
}
