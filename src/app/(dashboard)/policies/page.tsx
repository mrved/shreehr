import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'];

export const metadata = {
  title: 'Policy Documents | ShreeHR',
};

export default async function PoliciesPage() {
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

  const policies = await prisma.policyDocument.findMany({
    orderBy: { updated_at: 'desc' },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      embedding_status: true,
      chunk_count: true,
      is_active: true,
      updated_at: true,
    },
  });

  const statusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'PROCESSING':
        return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />;
      case 'FAILED':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Policy Documents</h1>
          <p className="text-muted-foreground">
            Manage HR policy documents for AI assistant
          </p>
        </div>
        <Link href="/policies/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Policy
          </Button>
        </Link>
      </div>

      {policies.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">No policy documents</p>
          <p className="text-muted-foreground mb-4">
            Add policy documents to enable AI-powered policy Q&A
          </p>
          <Link href="/policies/new">
            <Button>Add Your First Policy</Button>
          </Link>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Title</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Chunks</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {policies.map((policy) => (
                <tr key={policy.id} className={!policy.is_active ? 'opacity-50' : ''}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{policy.title}</div>
                    {policy.description && (
                      <div className="text-sm text-muted-foreground truncate max-w-xs">
                        {policy.description}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-muted">
                      {policy.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                    {policy.chunk_count}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {statusIcon(policy.embedding_status)}
                      <span className="text-sm capitalize">
                        {policy.embedding_status.toLowerCase()}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/policies/${policy.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
