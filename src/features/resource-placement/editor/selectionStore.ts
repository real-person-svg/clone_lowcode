import { createContext, useContext, useSyncExternalStore } from 'react';

export const createSelectionStore = () => {
  let selectedId: string | undefined;
  const listeners = new Set<() => void>();
  return {
    getSnapshot: () => selectedId,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    select: (id?: string) => {
      if (id !== selectedId) {
        selectedId = id;
        listeners.forEach((listener) => listener());
      }
    }
  };
};

export type SelectionStore = ReturnType<typeof createSelectionStore>;
export const SelectionContext = createContext<SelectionStore | null>(null);

export const useNodeSelected = (id: string) => {
  const store = useContext(SelectionContext);
  if (!store) throw new Error('选择状态上下文不存在');
  return useSyncExternalStore(
    store.subscribe,
    () => store.getSnapshot() === id,
    () => false
  );
};
