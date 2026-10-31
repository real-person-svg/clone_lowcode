const auditFields = [
  'creator',
  'updater',
  'createdAt',
  'updatedAt',
  'revision',
  'from'
] as const;

/** 解析操作快照，并移除顶层审计字段以聚焦业务差异。 */
export function parseLogSnapshot(value: string): Record<string, unknown> | undefined {
  if (!value) return undefined;
  const snapshot = JSON.parse(value);
  // 审计字段每次写入都会变化，只排除顶层元数据，保留业务对象内部的同名字段。
  for (const key of auditFields) delete snapshot[key];
  return snapshot;
}

/** 递归排序对象键以稳定展示，数组顺序保持不变。 */
function sortObjectKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortObjectKeys);
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort(
        /* 按文本顺序排列对象键。 */
        (a, b) => a.localeCompare(b))
      .reduce(
        /* 按排序后的键递归构造稳定对象。 */
        (sorted: Record<string, unknown>, key) => {
          sorted[key] = sortObjectKeys((value as Record<string, unknown>)[key]);
          return sorted;
        }, {});
  }
  return value;
}

/** 解析内嵌 configData 并格式化快照，非法历史文本保留用于展示。 */
export function formatDiffConfig(config: unknown): string {
  if (!config) return '';
  const { configData, ...restConfig } = config as Record<string, unknown>;
  let parsedConfigData = configData;
  if (typeof configData === 'string') {
    try {
      parsedConfigData = JSON.parse(configData);
    } catch (error) {
      // 历史损坏配置保留原文本，仍可查看和复制，不让格式化失败遮蔽原始数据。
      console.log('lxy parse diff configData error=== ', error);
    }
  }

  // 对象键排序只消除展示噪声；数组顺序承载配置含义，必须原样保留。
  return JSON.stringify(
    sortObjectKeys({ ...restConfig, configData: parsedConfigData }),
    null,
    2
  );
}
