import { type NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { invalidatePolls } from "@/lib/cache";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "HR_MANAGER"];

const ClosePollSchema = z.object({
  is_closed: z.boolean(),
});

/**
 * GET /api/polls/[id]
 * Poll detail with full results including option vote counts and current user's vote.
 * Auth: Any authenticated user.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const poll = await prisma.poll.findUnique({
      where: { id },
      include: {
        options: {
          orderBy: { order: "asc" },
          include: {
            _count: { select: { responses: true } },
          },
        },
        _count: { select: { responses: true } },
        author: { select: { name: true } },
      },
    });

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    // Include current user's vote if they are an employee
    let myVote: { optionId: string } | null = null;
    const employeeId = session.user.employeeId;

    if (employeeId) {
      const response = await prisma.pollResponse.findUnique({
        where: {
          poll_id_employee_id: { poll_id: id, employee_id: employeeId },
        },
        select: { option_id: true },
      });
      if (response) {
        myVote = { optionId: response.option_id };
      }
    }

    return NextResponse.json({ poll: { ...poll, myVote } });
  } catch (error) {
    console.error("Poll detail error:", error);
    return NextResponse.json({ error: "Failed to fetch poll" }, { status: 500 });
  }
}

/**
 * PATCH /api/polls/[id]
 * Close or reopen a poll.
 * RBAC: ADMIN, SUPER_ADMIN, HR_MANAGER only.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!ADMIN_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { is_closed } = ClosePollSchema.parse(body);

    // Verify the poll exists
    const existing = await prisma.poll.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    const poll = await prisma.poll.update({
      where: { id },
      data: { is_closed },
      include: {
        options: {
          orderBy: { order: "asc" },
          include: {
            _count: { select: { responses: true } },
          },
        },
        _count: { select: { responses: true } },
        author: { select: { name: true } },
      },
    });

    invalidatePolls();

    return NextResponse.json({ poll });
  } catch (error) {
    console.error("Poll update error:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Failed to update poll" }, { status: 500 });
  }
}
