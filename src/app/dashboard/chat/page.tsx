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

  // Allow all authenticated users to use AI chat
  // The AI will handle role-based access to data internally
  // Removed role restriction to match sidebar navigation

  return (
    <div className="h-[calc(100vh-4rem)] md:h-[calc(100vh-3.5rem)]">
      <ChatInterface showSidebar={true} />
    </div>
  );
}
