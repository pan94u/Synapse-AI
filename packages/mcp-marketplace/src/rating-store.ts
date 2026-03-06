import { mkdirSync, existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import type { MCPServerReview } from '@synapse/shared';

interface IndexEntry {
  id: string;
  serverId: string;
  userId: string;
  rating: number;
  createdAt: string;
}

export class MCPRatingStore {
  private reviewsDir: string;
  private indexPath: string;
  private index: IndexEntry[] = [];

  constructor(reviewsDir: string) {
    this.reviewsDir = reviewsDir;
    this.indexPath = join(reviewsDir, '_index.json');
    this.ensureDir();
    this.loadIndex();
  }

  private ensureDir(): void {
    if (!existsSync(this.reviewsDir)) {
      mkdirSync(this.reviewsDir, { recursive: true });
    }
  }

  private loadIndex(): void {
    if (existsSync(this.indexPath)) {
      try {
        this.index = JSON.parse(readFileSync(this.indexPath, 'utf-8'));
      } catch {
        this.index = [];
      }
    }
  }

  private saveIndex(): void {
    writeFileSync(this.indexPath, JSON.stringify(this.index, null, 2));
  }

  private entryPath(id: string): string {
    return join(this.reviewsDir, `${id}.json`);
  }

  addReview(
    review: Omit<MCPServerReview, 'id' | 'createdAt' | 'updatedAt'>,
  ): MCPServerReview {
    // Enforce one review per user per server
    const existing = this.index.find(
      (e) => e.serverId === review.serverId && e.userId === review.userId,
    );
    if (existing) {
      throw new Error(
        `User "${review.userId}" has already reviewed server "${review.serverId}"`,
      );
    }

    const now = new Date().toISOString();
    const full: MCPServerReview = {
      id: crypto.randomUUID(),
      ...review,
      createdAt: now,
      updatedAt: now,
    };

    writeFileSync(this.entryPath(full.id), JSON.stringify(full, null, 2));
    this.index.push({
      id: full.id,
      serverId: full.serverId,
      userId: full.userId,
      rating: full.rating,
      createdAt: full.createdAt,
    });
    this.saveIndex();

    return full;
  }

  getReview(id: string): MCPServerReview | undefined {
    const path = this.entryPath(id);
    if (!existsSync(path)) return undefined;
    try {
      return JSON.parse(readFileSync(path, 'utf-8'));
    } catch {
      return undefined;
    }
  }

  getReviews(serverId: string): MCPServerReview[] {
    const entries = this.index.filter((e) => e.serverId === serverId);
    return entries
      .map((e) => this.getReview(e.id))
      .filter((r): r is MCPServerReview => r !== undefined)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getAverageRating(serverId: string): { average: number; count: number } {
    const entries = this.index.filter((e) => e.serverId === serverId);
    if (entries.length === 0) return { average: 0, count: 0 };

    const sum = entries.reduce((acc, e) => acc + e.rating, 0);
    return {
      average: Math.round((sum / entries.length) * 100) / 100,
      count: entries.length,
    };
  }

  deleteReview(reviewId: string): boolean {
    const path = this.entryPath(reviewId);
    if (!existsSync(path)) return false;

    unlinkSync(path);
    this.index = this.index.filter((e) => e.id !== reviewId);
    this.saveIndex();
    return true;
  }

  getTotalCount(): number {
    return this.index.length;
  }
}
