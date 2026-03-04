import { type NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { addEmailJob } from "@/lib/email/queue";
import { invalidateAnnouncements } from "@/lib/cache";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "HR_MANAGER"];

const CreateAnnouncementSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be at most 200 characters"),
  content: z.string().min(1, "Content is required").max(5000, "Content must be at most 5000 characters"),
});

/**
 * GET /api/announcements
 * List active (non-archived) announcements.
 * Auth: Any authenticated user.
 */
export async function GET(_request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const announcements = await prisma.announcement.findMany({
      where: { is_archived: false },
      orderBy: { created_at: "desc" },
      take: 10,
      select: {
        id: true,
        title: true,
        content: true,
        is_archived: true,
        created_at: true,
        author: { select: { name: true } },
      },
    });

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error("Announcements list error:", error);
    return NextResponse.json({ error: "Failed to fetch announcements" }, { status: 500 });
  }
}

/**
 * POST /api/announcements
 * Create an announcement and queue org-wide email to all active employees.
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
    const { title, content } = CreateAnnouncementSchema.parse(body);

    // Create the announcement
    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        created_by: session.user.id,
      },
      select: {
        id: true,
        title: true,
        content: true,
        is_archived: true,
        created_at: true,
        author: { select: { name: true } },
      },
    });

    // Invalidate cache so dashboard picks up the new announcement immediately
    invalidateAnnouncements();

    // Query all active employees with a user email for org-wide notification
    const employees = await prisma.employee.findMany({
      where: { employment_status: "ACTIVE" },
      include: {
        user: { select: { email: true } },
      },
    });

    const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const postedBy = session.user.name ?? "HR Team";

    // Queue email jobs for all active employees who have an associated user account
    const emailJobs = employees
      .filter((emp) => emp.user?.email)
      .map((emp) =>
        addEmailJob("announcement-notification", emp.user!.email, {
          employeeName: emp.first_name,
          title,
          content,
          postedBy,
          dashboardUrl,
        }),
      );

    await Promise.all(emailJobs);

    return NextResponse.json({ announcement, emailsQueued: emailJobs.length }, { status: 201 });
  } catch (error) {
    console.error("Announcement create error:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Failed to create announcement" }, { status: 500 });
  }
}
