import { type NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { invalidatePolls } from "@/lib/cache";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "HR_MANAGER"];

const CreatePollSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be at most 200 characters"),
  description: z.string().max(1000, "Description must be at most 1000 characters").optional(),
  options: z
    .array(z.string().min(1, "Option label is required").max(200, "Option must be at most 200 characters"))
    .min(2, "At least 2 options required")
    .max(10, "At most 10 options allowed"),
  closes_at: z.string().datetime().optional(),
});

/**
 * GET /api/polls
 * List active (non-closed) polls with option vote counts and current user's vote.
 * Auth: Any authenticated user.
 */
export async function GET(_request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const polls = await prisma.poll.findMany({
      where: { is_closed: false },
      orderBy: { created_at: "desc" },
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

    // Merge current user's vote for each poll (if they are an employee)
    const employeeId = session.user.employeeId;
    let myVotesMap: Record<string, string> = {};

    if (employeeId && polls.length > 0) {
      const pollIds = polls.map((p) => p.id);
      const myVotes = await prisma.pollResponse.findMany({
        where: {
          employee_id: employeeId,
          poll_id: { in: pollIds },
        },
        select: { poll_id: true, option_id: true },
      });
      myVotesMap = Object.fromEntries(myVotes.map((v) => [v.poll_id, v.option_id]));
    }

    const pollsWithVote = polls.map((poll) => ({
      ...poll,
      myVote: myVotesMap[poll.id] ? { optionId: myVotesMap[poll.id] } : null,
    }));

    return NextResponse.json({ polls: pollsWithVote });
  } catch (error) {
    console.error("Polls list error:", error);
    return NextResponse.json({ error: "Failed to fetch polls" }, { status: 500 });
  }
}

/**
 * POST /api/polls
 * Create a poll with 2-10 options.
 * RBAC: ADMIN, SUPER_ADMIN, HR_MANAGER only.
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!ADMIN_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { title, description, options, closes_at } = CreatePollSchema.parse(body);

    const poll = await prisma.poll.create({
      data: {
        title,
        description,
        closes_at: closes_at ? new Date(closes_at) : undefined,
        created_by: session.user.id,
        options: {
          create: options.map((label, i) => ({ label, order: i })),
        },
      },
      include: {
        options: { orderBy: { order: "asc" } },
        author: { select: { name: true } },
      },
    });

    invalidatePolls();

    return NextResponse.json({ poll }, { status: 201 });
  } catch (error) {
    console.error("Poll create error:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Failed to create poll" }, { status: 500 });
  }
}
