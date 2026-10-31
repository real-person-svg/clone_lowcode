const auditFields = [
  'creator',
  'updater',
  'createdAt',
  'updatedAt',
  'revision',
  'from'
] as const;

export function parseLogSnapshot(value: string): Record<string, unknown> | undefined {
  if (!value) return undefined;
  const snapshot = JSON.parse(value);
  // Audit metadata changes on every write; only the top level is excluded from comparison.
  for (const key of auditFields) delete snapshot[key];
  return snapshot;
}

function sortObjectKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortObjectKeys);
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort((a, b) => a.localeCompare(b))
      .reduce((sorted: Record<string, unknown>, key) => {
        sorted[key] = sortObjectKeys((value as Record<string, unknown>)[key]);
        return sorted;
      }, {});
  }
  return value;
}

export function formatDiffConfig(config: unknown): string {
  if (!config) return '';
  const { configData, ...restConfig } = config as Record<string, unknown>;
  let parsedConfigData = configData;
  if (typeof configData === 'string') {
    try {
      parsedConfigData = JSON.parse(configData);
    } catch (error) {
      // Historical malformed configData remains visible and copyable as its original text.
      console.log('lxy parse diff configData error=== ', error);
    }
  }

  // Object order is presentation noise; array order carries configuration meaning.
  return JSON.stringify(
    sortObjectKeys({ ...restConfig, configData: parsedConfigData }),
    null,
    2
  );
}
