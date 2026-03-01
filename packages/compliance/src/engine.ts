import type { ComplianceRuleSet, PreHookResult, PostHookResult } from '@synapse/shared';
import { loadAllRuleSets } from './loader.js';
import { PreHook, type PreHookParams } from './pre-hook.js';
import { PostHook, type PostHookParams } from './post-hook.js';
import { DataMasker } from './masker.js';

export class ComplianceEngine {
  private configDir: string;
  private ruleSets = new Map<string, ComplianceRuleSet>();
  private preHook!: PreHook;
  private postHook!: PostHook;
  private masker: DataMasker;

  constructor(configDir?: string) {
    this.configDir = configDir ?? 'config/compliance/rules';
    this.masker = new DataMasker();
  }

  async initialize(): Promise<void> {
    this.ruleSets = loadAllRuleSets(this.configDir);
    this.preHook = new PreHook(this.ruleSets);
    this.postHook = new PostHook(this.ruleSets, this.masker);
    console.log(`[compliance] Loaded ${this.ruleSets.size} rule sets: ${Array.from(this.ruleSets.keys()).join(', ')}`);
  }

  preCheck(params: PreHookParams): PreHookResult {
    return this.preHook.evaluate(params);
  }

  postCheck(params: PostHookParams): PostHookResult {
    return this.postHook.evaluate(params);
  }

  getRuleSets(): Map<string, ComplianceRuleSet> {
    return this.ruleSets;
  }
}
