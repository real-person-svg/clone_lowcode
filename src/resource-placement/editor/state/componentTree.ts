import { isEqual } from 'lodash';

import { ComponentInstance } from '../configuration/types';
import { findComponentById } from '../configuration/utils';
import {
  canContainChildren,
  getTypeChangeError,
} from '../configuration/componentCapabilities';

/** 递归更新或删除目标节点，未变化的子树保留节点与数组引用。 */
export const updateTreeNode = (
  nodes: ComponentInstance[],
  id: string,
  update: (node: ComponentInstance) => ComponentInstance | null,
): ComponentInstance[] => {
  let changed = false;
  const next: ComponentInstance[] = [];
  nodes.forEach(
    /* 处理当前节点或递归更新其子树，并追踪是否发生变化。 */
    (node) => {
      let result: ComponentInstance | null = node;
      if (node.id === id) {
        result = update(node);
      } else if (node.children) {
        const children = updateTreeNode(node.children, id, update);
        if (children !== node.children) {
          result = { ...node, children };
        }
      }
      changed = changed || result !== node;
      if (result) {
        next.push(result);
      }
    });
  return changed ? next : nodes;
};

/** 合并节点更新，阻止不合法类型切换，并规范化容器 children。 */
export const patchTreeNode = (
  nodes: ComponentInstance[],
  id: string,
  updates: Partial<ComponentInstance>,
) =>
  updateTreeNode(nodes, id,
    /* 仅在属性实际变化且类型切换合法时创建新节点。 */
    (node) => {
      if (
        Object.entries(updates).every(
          /* 逐项比较更新字段，避免无效修改破坏引用稳定性。 */
          ([key, value]) =>
            isEqual(node[key as keyof ComponentInstance], value),
        )
      ) {
        return node;
      }
      const next = { ...node, ...updates };
      // 有子树时必须保留容器能力，不能通过切换类型隐式丢弃子节点。
      if (getTypeChangeError(node, next.properties.type)) return node;
      if (canContainChildren(next.properties.type)) {
        return { ...next, children: next.children ?? [] };
      }
      return { ...next, children: undefined };
    });

/** 向根层或指定容器插入节点，维护父节点关系。 */
export const insertTreeNode = (
  nodes: ComponentInstance[],
  node: ComponentInstance,
  parentId?: string,
  index?: number,
): ComponentInstance[] => {
  /** 复制兄弟数组并在目标位置插入新节点。 */
  const insert = (siblings: ComponentInstance[]) => {
    const next = [...siblings];
    next.splice(index ?? next.length, 0, { ...node, parent: parentId });
    return next;
  };

  return parentId
    ? updateTreeNode(nodes, parentId,
      /* 仅对允许子节点的目标容器执行插入。 */
      (parent) =>
        canContainChildren(parent.properties.type)
          ? { ...parent, children: insert(parent.children ?? []) }
          : parent,
    )
    : insert(nodes);
};

/** 移动节点到目标前后或内部，拒绝自引用和移入自身后代。 */
export const moveTreeNode = (
  nodes: ComponentInstance[],
  dragId: string,
  hoverId: string,
  position: 'before' | 'after' | 'inside',
): ComponentInstance[] => {
  const dragged = findComponentById(nodes, dragId);
  const target = findComponentById(nodes, hoverId);
  // 禁止移入自身或自身后代，避免先删除来源后连同目标一起丢失。
  if (
    !dragged ||
    !target ||
    dragId === hoverId ||
    findComponentById(dragged.children || [], hoverId)
  ) {
    return nodes;
  }
  if (position === 'inside' && !canContainChildren(target.properties.type)) {
    return nodes;
  }
  const remaining = updateTreeNode(nodes, dragId,
    /* 从原位置移除待移动节点，随后复用其内容插入新位置。 */
    () => null);
  if (position === 'inside') {
    return insertTreeNode(remaining, dragged, hoverId);
  }

  // 从实际树结构寻找目标父层，不依赖可能来自旧导入数据的 parent 标记。
  /** 递归定位目标的实际父层，在目标前后插入被移动节点。 */
  const insertBeside = (
    siblings: ComponentInstance[],
    parentId?: string,
  ): ComponentInstance[] => {
    const index = siblings.findIndex(
      /* 查找目标节点在当前兄弟层的位置。 */
      (node) => node.id === hoverId);
    if (index >= 0) {
      const next = [...siblings];
      next.splice(index + (position === 'after' ? 1 : 0), 0, {
        ...dragged,
        parent: parentId,
      });
      return next;
    }
    let changed = false;
    const next = siblings.map(
      /* 仅重建包含插入位置的祖先路径，其余分支保留引用。 */
      (node) => {
        const children = node.children && insertBeside(node.children, node.id);
        if (children && children !== node.children) {
          changed = true;
          return { ...node, children };
        }
        return node;
      });
    return changed ? next : siblings;
  };

  return insertBeside(remaining);
};
