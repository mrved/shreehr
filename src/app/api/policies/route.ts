import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { addEmbeddingJob } from '@/lib/queues/embedding.queue';

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'];

const createPolicySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  category: z.enum(['LEAVE', 'PAYROLL', 'ATTENDANCE', 'EXPENSE', 'GENERAL']),
  content: z.string().min(10),
  visibleToRoles: z.array(z.string()).optional().default([]),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  // Get user role
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Build where clause
  const where: Record<string, unknown> = { is_active: true };

  if (category) {
    where.category = category;
  }

  // Non-admins only see policies visible to their role or all
  if (!ADMIN_ROLES.includes(user.role)) {
    where.OR = [
      { visible_to_roles: { isEmpty: true } },
      { visible_to_roles: { hasSome: [user.role, 'ALL'] } },
    ];
  }

  const policies = await prisma.policyDocument.findMany({
    where,
    orderBy: { updated_at: 'desc' },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      embedding_status: true,
      chunk_count: true,
      last_embedded_at: true,
      created_at: true,
      updated_at: true,
    },
  });

  return NextResponse.json({ policies });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only admins can create policies
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || !ADMIN_ROLES.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createPolicySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { title, description, category, content, visibleToRoles } = parsed.data;

  // Create policy document
  const policy = await prisma.policyDocument.create({
    data: {
      title,
      description,
      category,
      content,
      visible_to_roles: visibleToRoles,
      created_by: session.user.id,
      updated_by: session.user.id,
    },
  });

  // Queue embedding job
  await addEmbeddingJob({
    policyId: policy.id,
    title: policy.title,
    category: policy.category,
    content: policy.content,
    visibleToRoles: policy.visible_to_roles,
  });

  return NextResponse.json({ policy }, { status: 201 });
}
