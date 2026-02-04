import { prisma } from '@/lib/db';

const MAX_HISTORY_MESSAGES = 20; // Keep last 20 messages for context

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls?: unknown;
}

/**
 * Get or create a conversation for a user.
 * If conversationId is provided, returns that conversation (with auth check).
 * Otherwise, creates a new conversation.
 */
export async function getOrCreateConversation(
  userId: string,
  conversationId?: string
): Promise<{ id: string; isNew: boolean }> {
  if (conversationId) {
    // Verify ownership
    const existing = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        user_id: userId,
      },
    });

    if (existing) {
      return { id: existing.id, isNew: false };
    }
    // If not found or not owned, fall through to create new
  }

  // Create new conversation
  const conversation = await prisma.conversation.create({
    data: {
      user_id: userId,
    },
  });

  return { id: conversation.id, isNew: true };
}

/**
 * Get conversation history for AI context.
 * Returns last N messages to fit within context window.
 */
export async function getConversationHistory(
  conversationId: string
): Promise<ConversationMessage[]> {
  const messages = await prisma.message.findMany({
    where: { conversation_id: conversationId },
    orderBy: { created_at: 'asc' },
    take: MAX_HISTORY_MESSAGES,
    select: {
      role: true,
      content: true,
      tool_calls: true,
    },
  });

  return messages.map((m) => ({
    role: m.role as ConversationMessage['role'],
    content: m.content,
    toolCalls: m.tool_calls,
  }));
}

/**
 * Save a message to conversation history.
 */
export async function saveMessage(
  conversationId: string,
  role: string,
  content: string,
  toolCalls?: unknown
): Promise<void> {
  await prisma.message.create({
    data: {
      conversation_id: conversationId,
      role,
      content,
      tool_calls: toolCalls ? JSON.parse(JSON.stringify(toolCalls)) : undefined,
    },
  });

  // Update conversation title from first user message
  if (role === 'user') {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { title: true },
    });

    if (!conversation?.title) {
      // Use first 50 chars of first user message as title
      const title = content.length > 50 ? content.substring(0, 47) + '...' : content;
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { title },
      });
    }
  }
}

/**
 * List conversations for a user.
 */
export async function listConversations(
  userId: string,
  limit: number = 20
) {
  return prisma.conversation.findMany({
    where: { user_id: userId },
    orderBy: { updated_at: 'desc' },
    take: limit,
    select: {
      id: true,
      title: true,
      created_at: true,
      updated_at: true,
    },
  });
}

/**
 * Delete a conversation and its messages.
 */
export async function deleteConversation(
  userId: string,
  conversationId: string
): Promise<boolean> {
  const deleted = await prisma.conversation.deleteMany({
    where: {
      id: conversationId,
      user_id: userId,
    },
  });

  return deleted.count > 0;
}
