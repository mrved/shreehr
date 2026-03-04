import { type NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { invalidateAnnouncements } from "@/lib/cache";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "HR_MANAGER"];
const SUPER_ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

const ArchiveAnnouncementSchema = z.object({
  is_archived: z.boolean(),
});

/**
 * PATCH /api/announcements/[id]
 * Archive or unarchive an announcement.
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
    const { is_archived } = ArchiveAnnouncementSchema.parse(body);

    // Verify the announcement exists
    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

    const announcement = await prisma.announcement.update({
      where: { id },
      data: { is_archived },
      select: {
        id: true,
        title: true,
        content: true,
        is_archived: true,
        created_at: true,
        updated_at: true,
        author: { select: { name: true } },
      },
    });

    invalidateAnnouncements();

    return NextResponse.json({ announcement });
  } catch (error) {
    console.error("Announcement update error:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Failed to update announcement" }, { status: 500 });
  }
}

/**
 * DELETE /api/announcements/[id]
 * Permanently delete an announcement.
 * RBAC: ADMIN, SUPER_ADMIN only.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!SUPER_ADMIN_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 });
  }

  const { id } = await params;

  try {
    // Verify the announcement exists
    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

    await prisma.announcement.delete({ where: { id } });

    invalidateAnnouncements();

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Announcement delete error:", error);
    return NextResponse.json({ error: "Failed to delete announcement" }, { status: 500 });
  }
}
