import { COMPONENT_CONFIGS } from './componentConfigs';
import type { ComponentInstance } from './types';

/** Palette capability also governs imported aliases and every tree mutation. */
export const canContainChildren = (type?: string) =>
  Boolean(COMPONENT_CONFIGS[(type || '').replace(/^Form/, '')]?.allowChildren);

export const getTypeChangeError = (
  component: ComponentInstance,
  nextType?: string,
) =>
  component.children?.length && !canContainChildren(nextType)
    ? '当前组件包含子组件，请先移出或删除子组件后再切换为非容器类型'
    : undefined;
