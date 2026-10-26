const sensitiveTerms = [
  'password',
  'token',
  'secret',
  'authorization',
  'cookie',
  'credential',
  'hash',
  'encrypted',
  'key',
];

export class AuditValueSanitizer {
  static sanitize(value: unknown, seen = new WeakSet<object>()): unknown {
    if (value === null || value === undefined) {
      return value;
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.sanitize(item, seen));
    }

    if (typeof value !== 'object') {
      return value;
    }

    if (seen.has(value)) {
      return '[Circular]';
    }

    seen.add(value);
    const sanitized: Record<string, unknown> = {};

    for (const [key, item] of Object.entries(value)) {
      sanitized[key] = this.isSensitiveKey(key)
        ? '[REDACTED]'
        : this.sanitize(item, seen);
    }

    return sanitized;
  }

  private static isSensitiveKey(key: string): boolean {
    const normalizedKey = key.toLowerCase().replaceAll(/[^a-z0-9]/g, '');
    return sensitiveTerms.some((term) => normalizedKey.includes(term));
  }
}
