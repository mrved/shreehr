'use client';

import type { UIMessage as AIMessage } from 'ai';
import { cn } from '@/lib/utils';
import { User, Bot, Loader2 } from 'lucide-react';

interface MessageListProps {
  messages: AIMessage[];
  isLoading: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  // Helper to extract text from parts
  const getMessageText = (message: AIMessage): string => {
    if (!message.parts || message.parts.length === 0) return '';

    return message.parts
      .filter((part: any) => part.type === 'text')
      .map((part: any) => part.text)
      .join('\n');
  };

  // Helper to get tool calls from parts
  const getToolCalls = (message: AIMessage): any[] => {
    if (!message.parts) return [];

    return message.parts.filter((part: any) => part.type === 'tool-call');
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <Bot className="h-12 w-12 mb-4" />
          <p className="text-lg font-medium">HR Assistant</p>
          <p className="text-sm text-center max-w-md mt-2">
            Ask me about your leave balance, salary, attendance, or company policies.
          </p>
        </div>
      )}

      {messages.map((message) => {
        const text = getMessageText(message);
        const toolCalls = getToolCalls(message);

        return (
          <div
            key={message.id}
            className={cn(
              'flex gap-3 max-w-[85%]',
              message.role === 'user' ? 'ml-auto flex-row-reverse' : ''
            )}
          >
            <div
              className={cn(
                'flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center',
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              )}
            >
              {message.role === 'user' ? (
                <User className="h-4 w-4" />
              ) : (
                <Bot className="h-4 w-4" />
              )}
            </div>

            <div
              className={cn(
                'rounded-lg px-4 py-2',
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              )}
            >
              <div className="whitespace-pre-wrap text-sm">
                {text}
              </div>

              {/* Show tool calls if any */}
              {toolCalls.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                  {toolCalls.map((tool: any, i: number) => (
                    <div key={i} className="flex items-center gap-1">
                      <span className="opacity-60">Used:</span>
                      <span className="font-mono">{tool.toolName}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {isLoading && (
        <div className="flex gap-3">
          <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-muted">
            <Bot className="h-4 w-4" />
          </div>
          <div className="rounded-lg px-4 py-2 bg-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        </div>
      )}
    </div>
  );
}
