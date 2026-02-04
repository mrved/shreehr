import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedLeaveTypes() {
  const types = [
    { name: 'Casual Leave', code: 'CL', is_paid: true, annual_quota: 12, requires_approval: true, min_days_notice: 1 },
    { name: 'Sick Leave', code: 'SL', is_paid: true, annual_quota: 12, requires_approval: true, min_days_notice: 0 },
    { name: 'Earned Leave', code: 'EL', is_paid: true, annual_quota: 15, requires_approval: true, min_days_notice: 7, max_carry_forward: 30 },
    { name: 'Maternity Leave', code: 'ML', is_paid: true, annual_quota: 182, requires_approval: true, min_days_notice: 30 },
    { name: 'Paternity Leave', code: 'PL', is_paid: true, annual_quota: 5, requires_approval: true, min_days_notice: 7 },
    { name: 'Compensatory Off', code: 'CO', is_paid: true, annual_quota: 0, requires_approval: true, min_days_notice: 1 },
    { name: 'Loss of Pay', code: 'LOP', is_paid: false, annual_quota: 0, requires_approval: true, min_days_notice: 1 },
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
  await pool.end();
}

seedLeaveTypes().catch(console.error);
