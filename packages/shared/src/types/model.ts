export type ProviderId = 'minimax' | 'claude';

export interface ModelConfig {
  provider: ProviderId;
  modelId: string;
  displayName: string;
  costTier: number;
  qualityTier: number;
  maxContextTokens: number;
}

export interface ProviderConfig {
  providerId: ProviderId;
  apiKey: string;
  baseURL?: string;
}
