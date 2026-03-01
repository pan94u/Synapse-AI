import type { ModelConfig, RoutingStrategy } from '@synapse/shared';
import type { CompletionParams, CompletionResult, ModelProvider, StreamChunk } from './types.js';

export class ModelRouter {
  private providers = new Map<string, ModelProvider>();
  private models: ModelConfig[] = [];
  private defaultModel: string;

  constructor(defaultModel: string) {
    this.defaultModel = defaultModel;
  }

  registerProvider(provider: ModelProvider, models: ModelConfig[]): void {
    this.providers.set(provider.providerId, provider);
    this.models.push(...models);
  }

  resolve(
    strategy: RoutingStrategy = 'default',
    requestedModel?: string,
  ): { provider: ModelProvider; modelId: string } {
    let modelConfig: ModelConfig | undefined;

    if (strategy === 'default') {
      const modelId = requestedModel ?? this.defaultModel;
      modelConfig = this.models.find((m) => m.modelId === modelId);
    } else if (strategy === 'cost-optimized') {
      modelConfig = [...this.models].sort((a, b) => a.costTier - b.costTier)[0];
    } else if (strategy === 'quality-first') {
      modelConfig = [...this.models].sort((a, b) => b.qualityTier - a.qualityTier)[0];
    }

    if (!modelConfig) {
      modelConfig = this.models.find((m) => m.modelId === this.defaultModel);
    }

    if (!modelConfig) {
      throw new Error(`No model configuration found`);
    }

    const provider = this.providers.get(modelConfig.provider);
    if (!provider) {
      throw new Error(`Provider "${modelConfig.provider}" not registered`);
    }

    return { provider, modelId: modelConfig.modelId };
  }

  async complete(
    params: Omit<CompletionParams, 'model'>,
    strategy: RoutingStrategy = 'default',
    requestedModel?: string,
  ): Promise<CompletionResult> {
    const { provider, modelId } = this.resolve(strategy, requestedModel);
    return provider.complete({ ...params, model: modelId });
  }

  async *completeStream(
    params: Omit<CompletionParams, 'model'>,
    strategy: RoutingStrategy = 'default',
    requestedModel?: string,
  ): AsyncIterable<StreamChunk> {
    const { provider, modelId } = this.resolve(strategy, requestedModel);
    yield* provider.completeStream({ ...params, model: modelId });
  }
}
