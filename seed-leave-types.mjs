import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seedLeaveTypes() {
  const types = [
    { name: 'Casual Leave', code: 'CL', is_paid: true, max_days_per_year: 12, requires_approval: true, min_days_notice: 1 },
    { name: 'Sick Leave', code: 'SL', is_paid: true, max_days_per_year: 12, requires_approval: true, min_days_notice: 0 },
    { name: 'Earned Leave', code: 'EL', is_paid: true, max_days_per_year: 15, requires_approval: true, min_days_notice: 7, can_carry_forward: true, max_carry_forward: 30 },
    { name: 'Maternity Leave', code: 'ML', is_paid: true, max_days_per_year: 182, requires_approval: true, min_days_notice: 30 },
    { name: 'Paternity Leave', code: 'PL', is_paid: true, max_days_per_year: 5, requires_approval: true, min_days_notice: 7 },
    { name: 'Compensatory Off', code: 'CO', is_paid: true, max_days_per_year: null, requires_approval: true, min_days_notice: 1 },
    { name: 'Loss of Pay', code: 'LOP', is_paid: false, max_days_per_year: null, requires_approval: true, min_days_notice: 1 },
  ];
  
  for (const t of types) {
    await prisma.leaveType.upsert({
      where: { code: t.code },
      create: t,
      update: t
    });
    console.log('Seeded:', t.name);
  }
  
  console.log('Done!');
}

seedLeaveTypes().catch(console.error).finally(() => prisma.$disconnect());
