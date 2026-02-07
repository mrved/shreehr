/**
 * Mock AI Provider for when AI services are not configured
 * Provides helpful responses to guide users
 */

import { streamText } from 'ai';

export function createMockModel() {
  return {
    doStream: async function* () {
      yield {
        type: 'text-delta',
        textDelta: 'I apologize, but the AI chat service is not yet configured. \n\n',
      };
      yield {
        type: 'text-delta',
        textDelta: 'To enable AI chat, your administrator needs to:\n',
      };
      yield {
        type: 'text-delta',
        textDelta: '1. Go to Vercel Dashboard\n',
      };
      yield {
        type: 'text-delta',
        textDelta: '2. Add AI_PROVIDER and API key environment variables\n',
      };
      yield {
        type: 'text-delta',
        textDelta: '3. Redeploy the application\n\n',
      };
      yield {
        type: 'text-delta',
        textDelta: 'In the meantime, you can still use all other ShreeHR features!',
      };
      yield {
        type: 'finish',
        finishReason: 'stop',
        usage: { promptTokens: 0, completionTokens: 0 },
      };
    },
  };
}