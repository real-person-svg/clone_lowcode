import { useMemo } from 'react';
import { Toast } from '@douyinfe/semi-ui';
import { formatDiffConfig } from '../snapshots';

export function useConfigDiff(oldConfig?: Record<string, any>, newConfig?: Record<string, any>) {
  /** 将前后快照分别格式化为稳定的差异文本。 */
  const { oldConfigText, newConfigText } = useMemo(
    () => ({
      oldConfigText: formatDiffConfig(oldConfig),
      newConfigText: formatDiffConfig(newConfig)
    }),
    [oldConfig, newConfig]
  );

  /** 将差异文本压缩为 JSON 后写入剪贴板，并反馈结果。 */
  const copyConfig = async (text: string) => {
    try {
      await navigator.clipboard.writeText(
        text ? JSON.stringify(JSON.parse(text)) : ''
      );
      Toast.success('复制成功');
    } catch {
      Toast.error('复制失败，请重试');
    }
  };

  const copyOld = () => void copyConfig(oldConfigText);

  const copyNew = () => void copyConfig(newConfigText);

  const empty = !oldConfigText && !newConfigText;

  return { oldConfigText, newConfigText, copyOld, copyNew, empty };
}
