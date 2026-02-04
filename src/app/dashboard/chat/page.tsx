import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ChatInterface } from '@/components/chat';

export const metadata = {
  title: 'AI Chat | ShreeHR Admin',
  description: 'Ask questions about HR policies, employee data, and more',
};

export default async function AdminChatPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/login');
  }

  // Only allow admin roles
  const allowedRoles = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'];
  if (!allowedRoles.includes(session.user.role)) {
    redirect('/dashboard');
  }

  return (
    <div className="h-[calc(100vh-4rem)] md:h-[calc(100vh-3.5rem)]">
      <ChatInterface showSidebar={true} />
    </div>
  );
}
