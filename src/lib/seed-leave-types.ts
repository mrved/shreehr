import { prisma } from "./db";

async function seedLeaveTypes() {
  const leaveTypes = [
    {
      name: "Casual Leave",
      code: "CL",
      description: "Casual leave for personal work",
      annual_quota: 12,
      max_carry_forward: 0,
      is_paid: true,
      requires_approval: true,
      min_days_notice: 1,
    },
    {
      name: "Sick Leave",
      code: "SL",
      description: "Leave for illness or medical reasons",
      annual_quota: 12,
      max_carry_forward: 6,
      is_paid: true,
      requires_approval: true,
      min_days_notice: 0,
    },
    {
      name: "Earned Leave",
      code: "EL",
      description: "Paid leave earned over service period",
      annual_quota: 15,
      max_carry_forward: 30,
      is_paid: true,
      requires_approval: true,
      min_days_notice: 7,
    },
    {
      name: "Compensatory Off",
      code: "CO",
      description: "Leave granted for extra working days",
      annual_quota: 0, // Given as needed
      max_carry_forward: 0,
      is_paid: true,
      requires_approval: true,
      min_days_notice: 1,
    },
    {
      name: "Leave Without Pay",
      code: "LWP",
      description: "Unpaid leave when other quotas exhausted",
      annual_quota: 365, // Unlimited but counted
      max_carry_forward: 0,
      is_paid: false,
      requires_approval: true,
      min_days_notice: 3,
    },
    {
      name: "Maternity Leave",
      code: "ML",
      description: "Maternity leave as per statutory requirements",
      annual_quota: 182, // 26 weeks as per law
      max_carry_forward: 0,
      is_paid: true,
      requires_approval: true,
      min_days_notice: 30,
    },
    {
      name: "Paternity Leave",
      code: "PL",
      description: "Leave for new fathers",
      annual_quota: 5,
      max_carry_forward: 0,
      is_paid: true,
      requires_approval: true,
      min_days_notice: 7,
    },
  ];

  console.log("Seeding leave types...");

  for (const lt of leaveTypes) {
    const existing = await prisma.leaveType.findFirst({
      where: { code: lt.code },
    });

    if (existing) {
      console.log(`Leave type ${lt.code} already exists, skipping`);
      continue;
    }

    await prisma.leaveType.create({
      data: lt,
    });
    console.log(`Created leave type: ${lt.name} (${lt.code})`);
  }

  console.log("Leave types seeded successfully!");
}

seedLeaveTypes()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
