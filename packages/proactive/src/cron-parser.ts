/** 5-field cron: minute hour day-of-month month day-of-week */
export interface CronFields {
  minutes: number[];
  hours: number[];
  daysOfMonth: number[];
  months: number[];
  daysOfWeek: number[];
}

function parseField(field: string, min: number, max: number): number[] {
  const values = new Set<number>();

  for (const part of field.split(',')) {
    const trimmed = part.trim();

    if (trimmed === '*') {
      for (let i = min; i <= max; i++) values.add(i);
      continue;
    }

    // */step
    const starStep = trimmed.match(/^\*\/(\d+)$/);
    if (starStep) {
      const step = parseInt(starStep[1], 10);
      for (let i = min; i <= max; i += step) values.add(i);
      continue;
    }

    // N-M or N-M/step
    const rangeMatch = trimmed.match(/^(\d+)-(\d+)(\/(\d+))?$/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      const step = rangeMatch[4] ? parseInt(rangeMatch[4], 10) : 1;
      for (let i = start; i <= end; i += step) values.add(i);
      continue;
    }

    // plain number
    const num = parseInt(trimmed, 10);
    if (!isNaN(num) && num >= min && num <= max) {
      values.add(num);
    }
  }

  return Array.from(values).sort((a, b) => a - b);
}

export function parseCron(expression: string): CronFields {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new Error(`Invalid cron expression: "${expression}" (expected 5 fields)`);
  }

  return {
    minutes: parseField(parts[0], 0, 59),
    hours: parseField(parts[1], 0, 23),
    daysOfMonth: parseField(parts[2], 1, 31),
    months: parseField(parts[3], 1, 12),
    daysOfWeek: parseField(parts[4], 0, 6),
  };
}

export function matchesCron(fields: CronFields, date: Date): boolean {
  return (
    fields.minutes.includes(date.getMinutes()) &&
    fields.hours.includes(date.getHours()) &&
    fields.daysOfMonth.includes(date.getDate()) &&
    fields.months.includes(date.getMonth() + 1) &&
    fields.daysOfWeek.includes(date.getDay())
  );
}
