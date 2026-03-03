import { mkdirSync, existsSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import type { InstallRecord, MarketplaceSkill } from '@synapse/shared';

export class SkillInstaller {
  private installedSkillsDir: string;
  private installedRecordPath: string;
  private records: InstallRecord[] = [];

  constructor(installedSkillsDir: string, installedRecordPath: string) {
    this.installedSkillsDir = installedSkillsDir;
    this.installedRecordPath = installedRecordPath;
    this.ensureDirs();
    this.loadRecords();
  }

  private ensureDirs(): void {
    if (!existsSync(this.installedSkillsDir)) {
      mkdirSync(this.installedSkillsDir, { recursive: true });
    }
    const recordDir = join(this.installedRecordPath, '..');
    if (!existsSync(recordDir)) {
      mkdirSync(recordDir, { recursive: true });
    }
  }

  private loadRecords(): void {
    if (existsSync(this.installedRecordPath)) {
      try {
        this.records = JSON.parse(readFileSync(this.installedRecordPath, 'utf-8'));
      } catch {
        this.records = [];
      }
    }
  }

  private saveRecords(): void {
    writeFileSync(this.installedRecordPath, JSON.stringify(this.records, null, 2));
  }

  install(skill: MarketplaceSkill): InstallRecord {
    const skillDir = join(this.installedSkillsDir, skill.id);
    if (!existsSync(skillDir)) {
      mkdirSync(skillDir, { recursive: true });
    }

    // Write SKILL.md content
    writeFileSync(join(skillDir, 'SKILL.md'), skill.skillContent);

    const now = new Date().toISOString();
    const existing = this.records.find((r) => r.skillId === skill.id);

    if (existing) {
      existing.version = skill.version;
      existing.updatedAt = now;
    } else {
      this.records.push({
        skillId: skill.id,
        version: skill.version,
        installedAt: now,
        updatedAt: now,
      });
    }

    this.saveRecords();
    return this.records.find((r) => r.skillId === skill.id)!;
  }

  uninstall(skillId: string): boolean {
    const skillDir = join(this.installedSkillsDir, skillId);

    if (existsSync(skillDir)) {
      rmSync(skillDir, { recursive: true, force: true });
    }

    const idx = this.records.findIndex((r) => r.skillId === skillId);
    if (idx === -1) return false;

    this.records.splice(idx, 1);
    this.saveRecords();
    return true;
  }

  update(skill: MarketplaceSkill): InstallRecord | undefined {
    if (!this.isInstalled(skill.id)) return undefined;
    return this.install(skill);
  }

  listInstalled(): InstallRecord[] {
    return [...this.records];
  }

  isInstalled(skillId: string): boolean {
    return this.records.some((r) => r.skillId === skillId);
  }

  getRecord(skillId: string): InstallRecord | undefined {
    return this.records.find((r) => r.skillId === skillId);
  }

  checkUpdates(
    getLatest: (skillId: string) => MarketplaceSkill | undefined,
  ): { skillId: string; current: string; latest: string }[] {
    const updates: { skillId: string; current: string; latest: string }[] = [];

    for (const record of this.records) {
      const latest = getLatest(record.skillId);
      if (latest && latest.version !== record.version) {
        updates.push({
          skillId: record.skillId,
          current: record.version,
          latest: latest.version,
        });
      }
    }

    return updates;
  }
}
