/**
 * Professional Tax Slabs Seed Data
 *
 * Seeds PT slabs for major Indian states:
 * - Karnataka (KA)
 * - Maharashtra (MH)
 * - Tamil Nadu (TN)
 * - Telangana (TS)
 *
 * Run: pnpm db:seed-pt
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Karnataka PT Slabs (FY 2023-24)
 *
 * Annual PT: Rs.2,400
 * - Rs.200/month for 11 months
 * - Rs.300 in February (special rate)
 * - Exemption: Monthly gross < Rs.15,000
 */
const karnatakaPTSlabs = [
  // February special rate
  {
    state_code: "KA",
    salary_from: 1500000, // Rs.15,000 in paise
    salary_to: null, // No upper limit
    tax_amount: 30000, // Rs.300 in paise
    month: 2, // February
    applies_to_gender: null,
    frequency: "MONTHLY" as const,
    is_active: true,
  },
  // General rate for other 11 months
  {
    state_code: "KA",
    salary_from: 1500000, // Rs.15,000 in paise
    salary_to: null,
    tax_amount: 20000, // Rs.200 in paise
    month: null, // All months except February
    applies_to_gender: null,
    frequency: "MONTHLY" as const,
    is_active: true,
  },
];

/**
 * Maharashtra PT Slabs (FY 2023-24)
 *
 * Progressive slabs:
 * - Rs.10,001 to Rs.25,000: Rs.175/month
 * - Above Rs.25,000: Rs.200/month
 * - Gender: Women pay reduced rate
 */
const maharashtraPTSlabs = [
  // Slab 1: Rs.10,001 to Rs.25,000 (Men)
  {
    state_code: "MH",
    salary_from: 1000100, // Rs.10,001 in paise
    salary_to: 2500000, // Rs.25,000 in paise
    tax_amount: 17500, // Rs.175 in paise
    month: null,
    applies_to_gender: "MALE" as const,
    frequency: "MONTHLY" as const,
    is_active: true,
  },
  // Slab 2: Above Rs.25,000 (Men)
  {
    state_code: "MH",
    salary_from: 2500100, // Rs.25,001 in paise
    salary_to: null,
    tax_amount: 20000, // Rs.200 in paise
    month: null,
    applies_to_gender: "MALE" as const,
    frequency: "MONTHLY" as const,
    is_active: true,
  },
  // Slab 1: Rs.10,001 to Rs.25,000 (Women)
  {
    state_code: "MH",
    salary_from: 1000100, // Rs.10,001 in paise
    salary_to: 2500000, // Rs.25,000 in paise
    tax_amount: 15000, // Rs.150 in paise (reduced)
    month: null,
    applies_to_gender: "FEMALE" as const,
    frequency: "MONTHLY" as const,
    is_active: true,
  },
  // Slab 2: Above Rs.25,000 (Women)
  {
    state_code: "MH",
    salary_from: 2500100, // Rs.25,001 in paise
    salary_to: null,
    tax_amount: 17500, // Rs.175 in paise (reduced)
    month: null,
    applies_to_gender: "FEMALE" as const,
    frequency: "MONTHLY" as const,
    is_active: true,
  },
];

/**
 * Tamil Nadu PT Slabs (FY 2023-24)
 *
 * Progressive slabs with higher rates:
 * - Rs.7,501 to Rs.10,000: Rs.135/month
 * - Rs.10,001 to Rs.12,500: Rs.150/month
 * - Above Rs.12,500: Rs.208.33/month (Rs.2,500/year)
 */
const tamilNaduPTSlabs = [
  // Slab 1: Rs.7,501 to Rs.10,000
  {
    state_code: "TN",
    salary_from: 750100, // Rs.7,501 in paise
    salary_to: 1000000, // Rs.10,000 in paise
    tax_amount: 13500, // Rs.135 in paise
    month: null,
    applies_to_gender: null,
    frequency: "MONTHLY" as const,
    is_active: true,
  },
  // Slab 2: Rs.10,001 to Rs.12,500
  {
    state_code: "TN",
    salary_from: 1000100, // Rs.10,001 in paise
    salary_to: 1250000, // Rs.12,500 in paise
    tax_amount: 15000, // Rs.150 in paise
    month: null,
    applies_to_gender: null,
    frequency: "MONTHLY" as const,
    is_active: true,
  },
  // Slab 3: Above Rs.12,500
  {
    state_code: "TN",
    salary_from: 1250100, // Rs.12,501 in paise
    salary_to: null,
    tax_amount: 20833, // Rs.208.33 in paise (Rs.2,500/12)
    month: null,
    applies_to_gender: null,
    frequency: "MONTHLY" as const,
    is_active: true,
  },
];

/**
 * Telangana PT Slabs (FY 2023-24)
 *
 * Progressive slabs:
 * - Rs.15,001 to Rs.20,000: Rs.150/month
 * - Above Rs.20,000: Rs.200/month
 */
const telanganaPTSlabs = [
  // Slab 1: Rs.15,001 to Rs.20,000
  {
    state_code: "TS",
    salary_from: 1500100, // Rs.15,001 in paise
    salary_to: 2000000, // Rs.20,000 in paise
    tax_amount: 15000, // Rs.150 in paise
    month: null,
    applies_to_gender: null,
    frequency: "MONTHLY" as const,
    is_active: true,
  },
  // Slab 2: Above Rs.20,000
  {
    state_code: "TS",
    salary_from: 2000100, // Rs.20,001 in paise
    salary_to: null,
    tax_amount: 20000, // Rs.200 in paise
    month: null,
    applies_to_gender: null,
    frequency: "MONTHLY" as const,
    is_active: true,
  },
];

async function main() {
  console.log("Seeding Professional Tax slabs...");

  // Delete existing PT slabs
  await prisma.professionalTaxSlab.deleteMany();
  console.log("Cleared existing PT slabs");

  // Seed Karnataka PT slabs
  const kaPTSlabs = await prisma.professionalTaxSlab.createMany({
    data: karnatakaPTSlabs,
  });
  console.log(`Created ${kaPTSlabs.count} Karnataka PT slabs`);

  // Seed Maharashtra PT slabs
  const mhPTSlabs = await prisma.professionalTaxSlab.createMany({
    data: maharashtraPTSlabs,
  });
  console.log(`Created ${mhPTSlabs.count} Maharashtra PT slabs`);

  // Seed Tamil Nadu PT slabs
  const tnPTSlabs = await prisma.professionalTaxSlab.createMany({
    data: tamilNaduPTSlabs,
  });
  console.log(`Created ${tnPTSlabs.count} Tamil Nadu PT slabs`);

  // Seed Telangana PT slabs
  const tsPTSlabs = await prisma.professionalTaxSlab.createMany({
    data: telanganaPTSlabs,
  });
  console.log(`Created ${tsPTSlabs.count} Telangana PT slabs`);

  console.log("✓ Professional Tax slabs seeded successfully");
}

main()
  .catch((e) => {
    console.error("Error seeding PT slabs:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
