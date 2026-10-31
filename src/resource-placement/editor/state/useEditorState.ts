import {
  useState,
  useCallback,
  useMemo,
  useReducer,
  useSyncExternalStore,
  useEffect,
  useRef,
  useLayoutEffect,
} from 'react';
import { isEqual } from 'lodash';
import { useParams } from 'react-router-dom';

import { api } from '@/resource-placement/api/client';

import { ComponentInstance, ResourcePlacementInfo } from '../configuration/types';
import { COMPONENT_CONFIGS } from '../library/componentConfigs';
import { generateComponentId, findComponentById } from '../configuration/utils';
import { transformConfigToEditorData } from '../configuration/dataTransform';

import {
  insertTreeNode,
  patchTreeNode,
  updateTreeNode,
  moveTreeNode,
} from './componentTree';
import { createSelectionStore } from './selectionStore';

type EditorAction =
  | { type: 'load' | 'replace'; components: ComponentInstance[] }
  | { type: 'edit'; apply: (nodes: ComponentInstance[]) => ComponentInstance[] }
  | { type: 'reset' };

/** 归并编辑器加载、替换和局部修改动作，维护是否有未保存变更。 */
const editorReducer = (
  state: { editorConfig: ComponentInstance[]; hasChanges: boolean },
  action: EditorAction,
) => {
  if (action.type === 'reset') {
    return { ...state, hasChanges: false };
  }
  const next =
    action.type === 'edit'
      ? action.apply(state.editorConfig)
      : action.components;
  // 局部编辑用引用判断变化；整树导入再做深比较，避免重复导入被误标为修改。
  if (
    next === state.editorConfig ||
    (action.type === 'replace' && isEqual(next, state.editorConfig))
  ) {
    return state;
  }
  return { editorConfig: next, hasChanges: action.type !== 'load' };
};

/** 管理编辑器组件树、当前资源和选中状态，并提供树操作入口。 */
export const useEditorState = () => {
  const [{ editorConfig, hasChanges }, dispatch] = useReducer(editorReducer, {
    editorConfig: [],
    hasChanges: false,
  });
  const [selectionStore] = useState(createSelectionStore);
  const pendingSelection = useRef<string>();
  const [curResourceDetail, setCurResourceDetail] = useState<
    ResourcePlacementInfo | undefined
  >(undefined);
  const selectedComponentId = useSyncExternalStore(
    selectionStore.subscribe,
    selectionStore.getSnapshot,
    /** 提供服务端渲染时的空选择快照。 */
    () => undefined,
  );
  const { id } = useParams<{ id: string }>();

  /** 根据选中 ID 从当前树中读取选中组件。 */
  const selectedComponent = useMemo(() => {
    if (!selectedComponentId) {
      return null;
    }
    return findComponentById(editorConfig, selectedComponentId);
  }, [selectedComponentId, editorConfig]);

  const loadRequest = useRef(0);
  /** 加载路由对应资源，并用请求序号忽略过期响应。 */
  const getResourceDetail = useCallback(async () => {
    const request = ++loadRequest.current;
    setCurResourceDetail(undefined);
    selectionStore.select(undefined);
    dispatch({ type: 'load', components: [] });
    const detail = await api.detail({ id: Number(id) });
    // 路由切换可产生并发加载，只接受最后一次请求，避免旧资源覆盖当前详情。
    if (request !== loadRequest.current) return;
    setCurResourceDetail(detail);

    dispatch({
      type: 'load',
      components: transformConfigToEditorData(detail.configData),
    });
  }, [id, selectionStore]);

  /** 将导入的组件树交给 reducer 判断是否实际变化。 */
  const updateComponents = useCallback((components: ComponentInstance[]) => {
    dispatch({ type: 'replace', components });
  }, []);

  /** 根据组件默认配置创建实例并插入树，提交后选中新节点。 */
  const addComponent = useCallback(
    (componentType: string, parentId?: string, index?: number) => {
      const config = COMPONENT_CONFIGS[componentType];
      if (!config) {
        return;
      }
      const component: ComponentInstance = {
        id: generateComponentId(),
        properties: { ...config.defaultProps },
        children: config.allowChildren ? [] : undefined,
        parent: parentId,
      };
      pendingSelection.current = component.id;
      dispatch({
        type: 'edit',
        /* 在当前树中插入新实例。 */
        apply: (nodes) => insertTreeNode(nodes, component, parentId, index),
      });
    },
    [],
  );

  /** 提交指定节点的局部属性更新。 */
  const updateComponent = useCallback(
    (componentId: string, updates: Partial<ComponentInstance>) => {
      dispatch({
        type: 'edit',
        /* 在当前树上合并指定节点的变化。 */
        apply: (nodes) => patchTreeNode(nodes, componentId, updates),
      });
    },
    [],
  );

  /** 提交删除指定组件及其子树的操作。 */
  const removeComponent = useCallback((componentId: string) => {
    dispatch({
      type: 'edit',
      /* 在当前树上移除目标节点。 */
      apply: (nodes) => updateTreeNode(nodes, componentId,
        /* 用空结果标记目标节点删除。 */
        () => null),
    });
  }, []);

  /** 提交节点的前置、后置或内部移动操作。 */
  const moveComponent = useCallback(
    (
      dragId: string,
      hoverId: string,
      position: 'before' | 'after' | 'inside',
    ) => {
      dispatch({
        type: 'edit',
        /* 在当前树上执行合法的节点移动。 */
        apply: (nodes) => moveTreeNode(nodes, dragId, hoverId, position),
      });
    },
    [],
  );

  // 原生拖放回调可能先于树提交完成，等待新节点进入树后再选中。
  useLayoutEffect(
    /* 在组件树提交后选中新插入节点，兼容原生拖放事件。 */
    () => {
      if (pendingSelection.current) {
        const componentId = pendingSelection.current;
        pendingSelection.current = undefined;
        if (findComponentById(editorConfig, componentId)) {
          selectionStore.select(componentId);
        }
      }
    }, [editorConfig, selectionStore]);

  useEffect(
    /* 选中节点已从树中移除时清空选择。 */
    () => {
      if (selectedComponentId && !selectedComponent) {
        selectionStore.select(undefined);
      }
    }, [selectedComponentId, selectedComponent, selectionStore]);

  /** 将当前编辑状态标记为已保存。 */
  const resetChanges = useCallback(() => {
    dispatch({ type: 'reset' });
  }, []);

  return {
    editorConfig,
    curResourceDetail,
    setCurResourceDetail,
    selectedComponent,
    setSelectedComponent: selectionStore.select,
    selectionStore,
    addComponent,
    updateComponent,
    removeComponent,
    moveComponent,
    hasChanges,
    resetChanges,
    getResourceDetail,
    updateComponents,
  };
};
