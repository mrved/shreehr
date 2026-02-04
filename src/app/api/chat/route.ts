import { streamText } from 'ai';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getChatModel, getProviderInfo } from '@/lib/ai/model-client';
import { HR_ASSISTANT_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { createEmployeeDataTools, getToolContext } from '@/lib/ai/tools';
import { createPolicySearchTool } from '@/lib/ai/tools/policy-search';
import {
  getOrCreateConversation,
  getConversationHistory,
  saveMessage,
} from '@/lib/ai/conversation';
import { logToolExecution } from '@/lib/audit';

export const maxDuration = 60; // 60 second timeout for streaming

export async function POST(req: Request) {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request
    const { messages, conversationId } = await req.json() as {
      messages: any[];
      conversationId?: string;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: 'Messages required' }, { status: 400 });
    }

    // Get last user message
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'user') {
      return Response.json({ error: 'Last message must be from user' }, { status: 400 });
    }

    // Get or create conversation
    const { id: convId, isNew } = await getOrCreateConversation(
      session.user.id,
      conversationId
    );

    // Save user message
    await saveMessage(convId, 'user', lastMessage.content as string);

    // Build context for tools
    const toolContext = await getToolContext();
    if (!toolContext) {
      return Response.json({ error: 'Unable to load user context' }, { status: 500 });
    }

    // Get employee name for personalization
    const employee = toolContext.employeeId
      ? await prisma.employee.findUnique({
          where: { id: toolContext.employeeId },
          select: { first_name: true },
        })
      : null;

    // Get conversation history
    const history = await getConversationHistory(convId);

    // Combine history with current messages
    // Filter out the last user message since we'll send it from the client
    const fullMessages = [
      ...history.slice(0, -1).map((m) => ({
        role: m.role,
        content: m.content,
      })),
      ...messages,
    ];

    // Create tools with context
    const employeeTools = createEmployeeDataTools(toolContext);
    const policyTools = createPolicySearchTool({ role: toolContext.role });

    // Combine all tools
    const tools = {
      ...employeeTools,
      ...policyTools,
    };

    // Create personalized system prompt
    const systemPrompt = employee
      ? `${HR_ASSISTANT_SYSTEM_PROMPT}\n\nYou are assisting ${employee.first_name}.`
      : HR_ASSISTANT_SYSTEM_PROMPT;

    // Get AI model based on provider configuration
    const model = await getChatModel();
    const providerInfo = getProviderInfo();
    console.log(`[Chat] Using AI provider: ${providerInfo.provider}, model: ${providerInfo.model}`);

    // User ID for audit logging
    const userId = session.user.id;

    // Stream response
    const result = streamText({
      // @ts-expect-error - Provider model types not fully compatible with AI SDK v6 typing
      model,
      system: systemPrompt,
      messages: fullMessages,
      tools,
      maxSteps: 5, // Prevent infinite tool call loops
      onStepFinish: async ({ toolCalls }) => {
        // Log each tool execution for audit trail
        if (toolCalls && toolCalls.length > 0) {
          for (const toolCall of toolCalls) {
            // Log tool execution (don't await to not block stream)
            logToolExecution(
              toolCall.toolName,
              toolCall.args as Record<string, unknown>,
              toolContext.employeeId, // Resource ID is the employee being accessed
              userId
            ).catch((err) => {
              console.error('[Audit] Failed to log tool execution:', err);
            });
          }
        }
      },
      onFinish: async ({ text, toolCalls }) => {
        // Save assistant response
        await saveMessage(convId, 'assistant', text, toolCalls);
      },
    });

    // Return streaming response with conversation ID in header
    const response = result.toTextStreamResponse();

    // Add conversation ID to response headers
    const headers = new Headers(response.headers);
    headers.set('X-Conversation-Id', convId);

    return new Response(response.body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Chat failed' },
      { status: 500 }
    );
  }
}
