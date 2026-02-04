'use client';

import { useState, useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { ConversationSidebar } from './conversation-sidebar';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInterfaceProps {
  showSidebar?: boolean;
}

export function ChatInterface({ showSidebar = true }: ChatInterfaceProps) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      headers: async () => {
        return {
          'Content-Type': 'application/json',
        };
      },
      body: async () => {
        return {
          conversationId,
        };
      },
    }),
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversation messages when switching
  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    } else {
      setMessages([]);
    }
  }, [conversationId, setMessages]);

  const loadConversation = async (id: string) => {
    try {
      const res = await fetch(`/api/conversations/${id}`);
      if (res.ok) {
        const data = await res.json();
        // Convert to UI message format
        setMessages(
          data.conversation.messages.map((m: { id: string; role: string; content: string }) => ({
            id: m.id,
            role: m.role,
            parts: [{ type: 'text', text: m.content }],
          }))
        );
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const handleNewConversation = () => {
    setConversationId(null);
    setMessages([]);
    setSidebarOpen(false);
  };

  const handleSelectConversation = (id: string | null) => {
    if (id === null) {
      handleNewConversation();
    } else {
      setConversationId(id);
      setSidebarOpen(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    await sendMessage({ parts: [{ type: 'text', text: message }] });
  };

  const isLoading = status === 'streaming' || status === 'submitted';

  return (
    <div className="flex h-full">
      {/* Sidebar for larger screens */}
      {showSidebar && (
        <>
          {/* Mobile sidebar overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <div
            className={cn(
              'fixed md:relative z-50 md:z-auto h-full w-64 bg-background border-r transform transition-transform md:transform-none',
              sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
            )}
          >
            <ConversationSidebar
              currentId={conversationId || undefined}
              onSelect={handleSelectConversation}
            />
          </div>
        </>
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header (mobile) */}
        {showSidebar && (
          <div className="md:hidden flex items-center gap-2 p-2 border-b">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <span className="font-medium">HR Assistant</span>
          </div>
        )}

        {/* Messages */}
        <MessageList messages={messages} isLoading={isLoading} />
        <div ref={messagesEndRef} />

        {/* Input */}
        <MessageInput onSubmit={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}
