import { type NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { invalidatePolls } from "@/lib/cache";

const VoteSchema = z.object({
  optionId: z.string().min(1, "Option ID is required"),
});

/**
 * POST /api/polls/[id]/vote
 * Cast or change a vote on a poll. One vote per employee per poll (upsert).
 * Auth: Must be an employee (have employeeId).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const employeeId = session.user.employeeId;
  if (!employeeId) {
    return NextResponse.json(
      { error: "Voting requires an employee account" },
      { status: 403 },
    );
  }

  const { id: pollId } = await params;

  try {
    const body = await request.json();
    const { optionId } = VoteSchema.parse(body);

    // Verify the poll exists and is not closed
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      select: { id: true, is_closed: true, closes_at: true },
    });

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    if (poll.is_closed) {
      return NextResponse.json({ error: "Poll has closed" }, { status: 400 });
    }

    // Check closes_at: if set and in the past, treat as closed
    if (poll.closes_at && poll.closes_at < new Date()) {
      return NextResponse.json({ error: "Poll has closed" }, { status: 400 });
    }

    // Verify the optionId belongs to this poll
    const option = await prisma.pollOption.findFirst({
      where: { id: optionId, poll_id: pollId },
      select: { id: true },
    });

    if (!option) {
      return NextResponse.json(
        { error: "Option does not belong to this poll" },
        { status: 400 },
      );
    }

    // Upsert: one vote per employee per poll; changing vote updates option_id
    const vote = await prisma.pollResponse.upsert({
      where: {
        poll_id_employee_id: { poll_id: pollId, employee_id: employeeId },
      },
      update: { option_id: optionId },
      create: {
        poll_id: pollId,
        employee_id: employeeId,
        option_id: optionId,
      },
      select: {
        id: true,
        poll_id: true,
        option_id: true,
        employee_id: true,
        created_at: true,
      },
    });

    invalidatePolls();

    return NextResponse.json({ success: true, vote });
  } catch (error) {
    console.error("Poll vote error:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Failed to cast vote" }, { status: 500 });
  }
}
