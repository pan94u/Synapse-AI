import { mkdirSync, existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import type { MarketplaceReview } from '@synapse/shared';

interface IndexEntry {
  id: string;
  skillId: string;
  userId: string;
  rating: number;
  createdAt: string;
}

export class RatingStore {
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

  addReview(review: Omit<MarketplaceReview, 'id' | 'createdAt' | 'updatedAt'>): MarketplaceReview {
    // Enforce one review per user per skill
    const existing = this.index.find(
      (e) => e.skillId === review.skillId && e.userId === review.userId,
    );
    if (existing) {
      throw new Error(`User "${review.userId}" has already reviewed skill "${review.skillId}"`);
    }

    const now = new Date().toISOString();
    const full: MarketplaceReview = {
      id: crypto.randomUUID(),
      ...review,
      createdAt: now,
      updatedAt: now,
    };

    writeFileSync(this.entryPath(full.id), JSON.stringify(full, null, 2));
    this.index.push({
      id: full.id,
      skillId: full.skillId,
      userId: full.userId,
      rating: full.rating,
      createdAt: full.createdAt,
    });
    this.saveIndex();

    return full;
  }

  updateReview(
    reviewId: string,
    updates: { rating?: number; comment?: string },
  ): MarketplaceReview | undefined {
    const review = this.getReview(reviewId);
    if (!review) return undefined;

    if (updates.rating !== undefined) review.rating = updates.rating;
    if (updates.comment !== undefined) review.comment = updates.comment;
    review.updatedAt = new Date().toISOString();

    writeFileSync(this.entryPath(reviewId), JSON.stringify(review, null, 2));

    const idx = this.index.findIndex((e) => e.id === reviewId);
    if (idx !== -1 && updates.rating !== undefined) {
      this.index[idx].rating = updates.rating;
      this.saveIndex();
    }

    return review;
  }

  deleteReview(reviewId: string): boolean {
    const path = this.entryPath(reviewId);
    if (!existsSync(path)) return false;

    unlinkSync(path);
    this.index = this.index.filter((e) => e.id !== reviewId);
    this.saveIndex();
    return true;
  }

  getReview(id: string): MarketplaceReview | undefined {
    const path = this.entryPath(id);
    if (!existsSync(path)) return undefined;
    try {
      return JSON.parse(readFileSync(path, 'utf-8'));
    } catch {
      return undefined;
    }
  }

  getReviews(skillId: string): MarketplaceReview[] {
    const entries = this.index.filter((e) => e.skillId === skillId);
    return entries
      .map((e) => this.getReview(e.id))
      .filter((r): r is MarketplaceReview => r !== undefined)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getAverageRating(skillId: string): { average: number; count: number } {
    const entries = this.index.filter((e) => e.skillId === skillId);
    if (entries.length === 0) return { average: 0, count: 0 };

    const sum = entries.reduce((acc, e) => acc + e.rating, 0);
    return {
      average: Math.round((sum / entries.length) * 100) / 100,
      count: entries.length,
    };
  }

  getTotalCount(): number {
    return this.index.length;
  }
}
