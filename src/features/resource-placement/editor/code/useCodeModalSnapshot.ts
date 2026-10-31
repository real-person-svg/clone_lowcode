import { useCallback, useState } from 'react';

import { recordLifecycleMetric } from '../runtime/performance';

// Capture the latest configuration at the start of each editing session.
export const useCodeModalSnapshot = (createSnapshot: () => string) => {
  const [state, setState] = useState<{ visible: boolean; snapshot?: string }>({ visible: false });
  const open = useCallback(() => {
    const snapshot = createSnapshot();
    recordLifecycleMetric('codeSnapshots');
    setState({ visible: true, snapshot });
  }, [createSnapshot]);
  const close = useCallback(() => {
    setState((current) => ({ ...current, visible: false }));
  }, []);
  return { ...state, open, close };
};
