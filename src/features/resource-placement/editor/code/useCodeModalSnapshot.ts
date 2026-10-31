import { useCallback, useState } from 'react';

import { recordLifecycleMetric } from '../runtime/performance';

/** 管理代码弹窗可见性，每次打开时捕获最新配置快照。 */
export const useCodeModalSnapshot = (createSnapshot: () => string) => {
  const [state, setState] = useState<{ visible: boolean; snapshot?: string }>({ visible: false });
  /** 先生成快照再打开弹窗，序列化失败时不展示旧内容。 */
  const open = useCallback(() => {
    const snapshot = createSnapshot();
    recordLifecycleMetric('codeSnapshots');
    setState({ visible: true, snapshot });
  }, [createSnapshot]);
  /** 关闭弹窗并保留本轮快照。 */
  const close = useCallback(() => {
    setState(/* 只更新可见状态，保留其他弹窗数据。 */ (current) => ({ ...current, visible: false }));
  }, []);
  return { ...state, open, close };
};
