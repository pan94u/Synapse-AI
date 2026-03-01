interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export class MCPRateLimiter {
  private configs = new Map<string, RateLimitConfig>();
  private timestamps = new Map<string, number[]>();

  configure(serverId: string, config: RateLimitConfig): void {
    this.configs.set(serverId, config);
  }

  tryAcquire(serverId: string): boolean {
    const config = this.configs.get(serverId);
    if (!config) return true; // No limit configured

    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Get or create timestamps array
    let times = this.timestamps.get(serverId);
    if (!times) {
      times = [];
      this.timestamps.set(serverId, times);
    }

    // Remove expired timestamps (sliding window)
    const validTimes = times.filter((t) => t > windowStart);
    this.timestamps.set(serverId, validTimes);

    if (validTimes.length >= config.maxRequests) {
      return false; // Rate limited
    }

    validTimes.push(now);
    return true;
  }

  getRemainingQuota(serverId: string): number {
    const config = this.configs.get(serverId);
    if (!config) return Infinity;

    const now = Date.now();
    const windowStart = now - config.windowMs;
    const times = this.timestamps.get(serverId) ?? [];
    const validCount = times.filter((t) => t > windowStart).length;

    return Math.max(0, config.maxRequests - validCount);
  }
}
