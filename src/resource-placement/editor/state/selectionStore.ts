import { createContext, useContext, useSyncExternalStore } from 'react';

/** 创建独立的组件选择存储，只在选中 ID 变化时通知订阅者。 */
export const createSelectionStore = () => {
  let selectedId: string | undefined;
  const listeners = new Set<() => void>();
  return {
    /* 返回当前选中的组件 ID。 */
    getSnapshot: () => selectedId,
    /* 订阅选择变化并返回清理方法。 */
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      /* 移除当前选择监听器。 */
      return () => {
        listeners.delete(listener);
      };
    },
    /* 更新选中 ID，值未变化时不发送通知。 */
    select: (id?: string) => {
      if (id !== selectedId) {
        selectedId = id;
        listeners.forEach(
          /* 通知监听器重新读取选择快照。 */
          (listener) => listener());
      }
    }
  };
};

export type SelectionStore = ReturnType<typeof createSelectionStore>;
export const SelectionContext = createContext<SelectionStore | null>(null);

/** 订阅当前节点是否选中，隔离其他节点的选择变化。 */
export const useNodeSelected = (id: string) => {
  const store = useContext(SelectionContext);
  if (!store) throw new Error('选择状态上下文不存在');
  return useSyncExternalStore(
    store.subscribe,
    /** 将全局选中 ID 转为当前节点的布尔快照。 */
    () => store.getSnapshot() === id,
    /** 服务端渲染时默认未选中。 */
    () => false
  );
};
