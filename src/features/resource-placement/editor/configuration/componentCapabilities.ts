import { COMPONENT_CONFIGS } from '../library/componentConfigs';
import type { ComponentInstance } from './types';

/** 依据组件库能力判断类型是否允许子节点，兼容 Form 别名。 */
export const canContainChildren = (type?: string) =>
  Boolean(COMPONENT_CONFIGS[(type || '').replace(/^Form/, '')]?.allowChildren);

/** 阻止有子节点的组件切换成非容器，避免隐藏或丢失子树。 */
export const getTypeChangeError = (
  component: ComponentInstance,
  nextType?: string,
) =>
  component.children?.length && !canContainChildren(nextType)
    ? '当前组件包含子组件，请先移出或删除子组件后再切换为非容器类型'
    : undefined;
