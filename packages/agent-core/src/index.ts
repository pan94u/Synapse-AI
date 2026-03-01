import type { ModelConfig } from '@synapse/shared';
import { MiniMaxProvider } from './models/provider-minimax.js';
import { ClaudeProvider } from './models/provider-claude.js';
import { ModelRouter } from './models/router.js';

export { ModelRouter } from './models/router.js';
export { MiniMaxProvider } from './models/provider-minimax.js';
export { ClaudeProvider } from './models/provider-claude.js';
export type { ModelProvider, CompletionParams, CompletionResult, StreamChunk } from './models/types.js';

export function createDefaultRouter(): ModelRouter {
  const router = new ModelRouter('MiniMax-M2.5');

  const minimaxKey = process.env.MINIMAX_API_KEY;
  if (minimaxKey) {
    const provider = new MiniMaxProvider(minimaxKey);
    const models: ModelConfig[] = [
      {
        provider: 'minimax',
        modelId: 'MiniMax-M2.5',
        displayName: 'MiniMax M2.5',
        costTier: 1,
        qualityTier: 3,
        maxContextTokens: 1000000,
      },
      {
        provider: 'minimax',
        modelId: 'MiniMax-M1',
        displayName: 'MiniMax M1',
        costTier: 1,
        qualityTier: 2,
        maxContextTokens: 1000000,
      },
    ];
    router.registerProvider(provider, models);
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    const provider = new ClaudeProvider(anthropicKey);
    const models: ModelConfig[] = [
      {
        provider: 'claude',
        modelId: 'claude-sonnet-4-20250514',
        displayName: 'Claude Sonnet 4',
        costTier: 3,
        qualityTier: 4,
        maxContextTokens: 200000,
      },
      {
        provider: 'claude',
        modelId: 'claude-opus-4-20250514',
        displayName: 'Claude Opus 4',
        costTier: 5,
        qualityTier: 5,
        maxContextTokens: 200000,
      },
    ];
    router.registerProvider(provider, models);
  }

  return router;
}
