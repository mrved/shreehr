import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { LeaveRequestForm } from '@/components/leave/leave-request-form';

export default async function ApplyLeavePage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Apply for Leave</h1>
        <p className="text-muted-foreground">Submit a new leave request</p>
      </div>

      <LeaveRequestForm />
    </div>
  );
}
