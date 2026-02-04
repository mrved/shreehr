import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import PolicyEditForm from './policy-edit-form';

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'];

export default async function EditPolicyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/auth/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || !ADMIN_ROLES.includes(user.role)) {
    redirect('/dashboard');
  }

  const { id } = await params;

  const policy = await prisma.policyDocument.findUnique({
    where: { id },
  });

  if (!policy) {
    notFound();
  }

  return <PolicyEditForm policy={policy} />;
}
