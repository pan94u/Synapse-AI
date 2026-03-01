export interface MaskConfig {
  pattern: string;
  method: 'middle_mask' | 'tail_mask' | 'role_based' | 'full_mask';
  allowedRoles?: string[];
}

// Default sensitive field patterns and their masking methods
const DEFAULT_MASKS: MaskConfig[] = [
  { pattern: 'phone', method: 'middle_mask' },
  { pattern: 'mobile', method: 'middle_mask' },
  { pattern: 'id_card', method: 'middle_mask' },
  { pattern: 'id_number', method: 'middle_mask' },
  { pattern: 'bank_account', method: 'tail_mask' },
  { pattern: 'bank_card', method: 'tail_mask' },
  { pattern: 'salary', method: 'full_mask' },
  { pattern: 'password', method: 'full_mask' },
  { pattern: 'secret', method: 'full_mask' },
];

function applyMask(value: string, method: MaskConfig['method']): string {
  if (!value || value.length === 0) return value;

  switch (method) {
    case 'middle_mask': {
      // Keep first 3 and last 4 chars, mask middle
      if (value.length <= 7) return '****';
      return value.slice(0, 3) + '***' + value.slice(-4);
    }
    case 'tail_mask': {
      // Keep last 4, mask the rest
      if (value.length <= 4) return '****';
      return '****' + value.slice(-4);
    }
    case 'full_mask':
      return '****';
    case 'role_based':
      // In Phase 4 simplified version, non-allowed roles see full mask
      return '****';
    default:
      return '****';
  }
}

function matchFieldName(pattern: string, fieldName: string): boolean {
  const lower = fieldName.toLowerCase();
  return lower.includes(pattern.toLowerCase());
}

function maskObject(
  obj: Record<string, unknown>,
  configs: MaskConfig[],
  maskedFields: string[],
  path: string,
  personaId?: string,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const fullPath = path ? `${path}.${key}` : key;

    // Check if this field matches any mask config
    const matchedConfig = configs.find((c) => matchFieldName(c.pattern, key));

    if (matchedConfig) {
      // Check role-based access
      if (matchedConfig.method === 'role_based' && matchedConfig.allowedRoles?.includes(personaId ?? '')) {
        result[key] = value;
      } else if (typeof value === 'string') {
        result[key] = applyMask(value, matchedConfig.method);
        maskedFields.push(fullPath);
      } else if (typeof value === 'number') {
        result[key] = applyMask(String(value), matchedConfig.method);
        maskedFields.push(fullPath);
      } else {
        result[key] = '****';
        maskedFields.push(fullPath);
      }
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = maskObject(value as Record<string, unknown>, configs, maskedFields, fullPath, personaId);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item, idx) => {
        if (item !== null && typeof item === 'object') {
          return maskObject(item as Record<string, unknown>, configs, maskedFields, `${fullPath}[${idx}]`, personaId);
        }
        return item;
      });
    } else {
      result[key] = value;
    }
  }

  return result;
}

export class DataMasker {
  private configs: MaskConfig[];

  constructor(configs?: MaskConfig[]) {
    this.configs = configs ?? DEFAULT_MASKS;
  }

  mask(data: string, extraConfigs?: MaskConfig[], personaId?: string): { masked: string; maskedFields: string[] } {
    const allConfigs = extraConfigs ? [...this.configs, ...extraConfigs] : this.configs;
    const maskedFields: string[] = [];

    // Try to parse as JSON
    try {
      const parsed = JSON.parse(data);
      if (typeof parsed === 'object' && parsed !== null) {
        if (Array.isArray(parsed)) {
          const masked = parsed.map((item, idx) => {
            if (item !== null && typeof item === 'object') {
              return maskObject(item as Record<string, unknown>, allConfigs, maskedFields, `[${idx}]`, personaId);
            }
            return item;
          });
          return { masked: JSON.stringify(masked, null, 2), maskedFields };
        }
        const masked = maskObject(parsed, allConfigs, maskedFields, '', personaId);
        return { masked: JSON.stringify(masked, null, 2), maskedFields };
      }
    } catch {
      // Not JSON — apply regex-based masking for common patterns
    }

    // Regex-based masking for plain text
    let masked = data;

    // Chinese phone numbers: 1xx xxxx xxxx
    const phoneRegex = /\b1[3-9]\d{9}\b/g;
    if (phoneRegex.test(masked)) {
      masked = masked.replace(/\b(1[3-9]\d)\d{4}(\d{4})\b/g, '$1****$2');
      maskedFields.push('phone_in_text');
    }

    // ID card numbers (18 digits)
    const idRegex = /\b\d{6}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]\b/g;
    if (idRegex.test(data)) {
      masked = masked.replace(/\b(\d{3})\d{11}(\d{4})\b/g, '$1***********$2');
      maskedFields.push('id_card_in_text');
    }

    return { masked, maskedFields };
  }
}
