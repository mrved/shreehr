import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { addEmbeddingJob } from '@/lib/queues/embedding.queue';
import { qdrant, POLICIES_COLLECTION } from '@/lib/qdrant/client';

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'];

const updatePolicySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  category: z.enum(['LEAVE', 'PAYROLL', 'ATTENDANCE', 'EXPENSE', 'GENERAL']).optional(),
  content: z.string().min(10).optional(),
  visibleToRoles: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const policy = await prisma.policyDocument.findUnique({
    where: { id },
  });

  if (!policy) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ policy });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || !ADMIN_ROLES.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = updatePolicySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const existing = await prisma.policyDocument.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { title, description, category, content, visibleToRoles, isActive } = parsed.data;

  // Check if content changed (requires re-embedding)
  const contentChanged = content && content !== existing.content;

  const policy = await prisma.policyDocument.update({
    where: { id },
    data: {
      title,
      description,
      category,
      content,
      visible_to_roles: visibleToRoles,
      is_active: isActive,
      updated_by: session.user.id,
      // Reset embedding status if content changed
      ...(contentChanged && {
        embedding_status: 'PENDING',
        chunk_count: 0,
        last_embedded_at: null,
      }),
    },
  });

  // Re-queue embedding if content changed
  if (contentChanged) {
    await addEmbeddingJob({
      policyId: policy.id,
      title: policy.title,
      category: policy.category,
      content: policy.content,
      visibleToRoles: policy.visible_to_roles,
    });
  }

  return NextResponse.json({ policy });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || !ADMIN_ROLES.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  // Delete from Qdrant first
  try {
    await qdrant.delete(POLICIES_COLLECTION, {
      filter: {
        must: [{ key: 'policyId', match: { value: id } }],
      },
    });
  } catch (e) {
    console.error('Failed to delete from Qdrant:', e);
    // Continue with Prisma delete even if Qdrant fails
  }

  // Delete from Prisma
  await prisma.policyDocument.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
