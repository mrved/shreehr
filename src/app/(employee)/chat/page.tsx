import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ChatInterface } from '@/components/chat';

export const metadata = {
  title: 'HR Assistant | ShreeHR',
  description: 'Ask questions about HR policies, leave, salary, and more',
};

export default async function ChatPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/login');
  }

  return (
    <div className="h-[calc(100vh-4rem)] md:h-[calc(100vh-3.5rem)]">
      <ChatInterface showSidebar={true} />
    </div>
  );
}
