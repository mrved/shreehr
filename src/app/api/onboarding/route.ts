import { OnboardingStatus, UserRole } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { addEmailJob } from "@/lib/email/queue";
import { type CreateOnboardingInput, createOnboardingSchema } from "@/lib/validations/onboarding";
import { generateDefaultChecklist } from "@/lib/workflows/onboarding";

/**
 * GET /api/onboarding
 * List onboarding records with optional status filter
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN and HR_MANAGER can list all onboarding records
    if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.HR_MANAGER) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get status filter from query params
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");

    const where: { status?: OnboardingStatus } = {};
    if (statusParam) {
      where.status = statusParam as OnboardingStatus;
    }

    const records = await prisma.onboardingRecord.findMany({
      where,
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        designation: {
          select: {
            id: true,
            title: true,
          },
        },
        employee: {
          select: {
            id: true,
            employee_code: true,
            first_name: true,
            last_name: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error("Error fetching onboarding records:", error);
    return NextResponse.json({ error: "Failed to fetch onboarding records" }, { status: 500 });
  }
}

/**
 * POST /api/onboarding
 * Create new onboarding record
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN and HR_MANAGER can create onboarding records
    if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.HR_MANAGER) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validation = createOnboardingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 },
      );
    }

    const data: CreateOnboardingInput = validation.data;

    // Generate unique offer token
    const offerToken = crypto.randomUUID();

    // Generate default checklist if not provided
    const checklist = data.checklist || generateDefaultChecklist(data.joining_date);

    // Create onboarding record
    const record = await prisma.onboardingRecord.create({
      data: {
        candidate_email: data.candidate_email,
        candidate_name: data.candidate_name,
        candidate_phone: data.candidate_phone,
        position: data.position,
        department_id: data.department_id,
        designation_id: data.designation_id,
        offered_salary_paise: data.offered_salary_paise,
        offer_date: new Date(),
        joining_date: data.joining_date,
        status: OnboardingStatus.PENDING,
        checklist: checklist as any,
        offer_token: offerToken,
        offer_sent_at: new Date(),
        created_by: session.user.id,
        updated_by: session.user.id,
      },
      include: {
        department: true,
        designation: true,
      },
    });

    // Queue offer letter notification email
    const companyName = process.env.COMPANY_NAME || "ShreeHR";
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const acceptUrl = `${baseUrl}/onboarding/accept?token=${offerToken}`;

    await addEmailJob("offer-letter", data.candidate_email, {
      candidateName: data.candidate_name,
      position: data.position,
      companyName,
      joiningDate: data.joining_date,
      acceptUrl,
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("Error creating onboarding record:", error);
    return NextResponse.json({ error: "Failed to create onboarding record" }, { status: 500 });
  }
}
