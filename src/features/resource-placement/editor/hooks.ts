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

import { api } from '@/features/resource-placement/api/client';

import { ComponentInstance, ResourcePlacementInfo } from './types';
import { COMPONENT_CONFIGS } from './componentConfigs';
import { generateComponentId, findComponentById } from './utils';
import { transformConfigToEditorData } from './dataTransform';

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
  // Full comparison is reserved for imported configurations; local edits use structural sharing.
  if (
    next === state.editorConfig ||
    (action.type === 'replace' && isEqual(next, state.editorConfig))
  ) {
    return state;
  }
  return { editorConfig: next, hasChanges: action.type !== 'load' };
};

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
    () => undefined,
  );
  const { id } = useParams<{ id: string }>();

  const selectedComponent = useMemo(() => {
    if (!selectedComponentId) {
      return null;
    }
    return findComponentById(editorConfig, selectedComponentId);
  }, [selectedComponentId, editorConfig]);

  const loadRequest = useRef(0);
  const getResourceDetail = useCallback(async () => {
    const request = ++loadRequest.current;
    setCurResourceDetail(undefined);
    selectionStore.select(undefined);
    dispatch({ type: 'load', components: [] });
    const detail = await api.detail({ id: Number(id) });
    if (request !== loadRequest.current) return;
    setCurResourceDetail(detail);

    dispatch({
      type: 'load',
      components: transformConfigToEditorData(detail.configData),
    });
  }, [id, selectionStore]);

  const updateComponents = useCallback((components: ComponentInstance[]) => {
    dispatch({ type: 'replace', components });
  }, []);

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
        apply: (nodes) => insertTreeNode(nodes, component, parentId, index),
      });
    },
    [],
  );

  const updateComponent = useCallback(
    (componentId: string, updates: Partial<ComponentInstance>) => {
      dispatch({
        type: 'edit',
        apply: (nodes) => patchTreeNode(nodes, componentId, updates),
      });
    },
    [],
  );

  const removeComponent = useCallback((componentId: string) => {
    dispatch({
      type: 'edit',
      apply: (nodes) => updateTreeNode(nodes, componentId, () => null),
    });
  }, []);

  const moveComponent = useCallback(
    (
      dragId: string,
      hoverId: string,
      position: 'before' | 'after' | 'inside',
    ) => {
      dispatch({
        type: 'edit',
        apply: (nodes) => moveTreeNode(nodes, dragId, hoverId, position),
      });
    },
    [],
  );

  // Select newly inserted nodes after their state has committed, including native DnD events.
  useLayoutEffect(() => {
    if (pendingSelection.current) {
      const componentId = pendingSelection.current;
      pendingSelection.current = undefined;
      if (findComponentById(editorConfig, componentId)) {
        selectionStore.select(componentId);
      }
    }
  }, [editorConfig, selectionStore]);

  useEffect(() => {
    if (selectedComponentId && !selectedComponent) {
      selectionStore.select(undefined);
    }
  }, [selectedComponentId, selectedComponent, selectionStore]);

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
