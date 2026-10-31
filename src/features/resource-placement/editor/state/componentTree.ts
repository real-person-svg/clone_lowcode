import { isEqual } from 'lodash';

import { ComponentInstance } from '../configuration/types';
import {
  canContainChildren,
  getTypeChangeError,
} from '../configuration/componentCapabilities';

// Unchanged subtrees retain both their node and array references.
export const updateTreeNode = (
  nodes: ComponentInstance[],
  id: string,
  update: (node: ComponentInstance) => ComponentInstance | null,
): ComponentInstance[] => {
  let changed = false;
  const next: ComponentInstance[] = [];
  nodes.forEach((node) => {
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

export const patchTreeNode = (
  nodes: ComponentInstance[],
  id: string,
  updates: Partial<ComponentInstance>,
) =>
  updateTreeNode(nodes, id, (node) => {
    if (
      Object.entries(updates).every(([key, value]) =>
        isEqual(node[key as keyof ComponentInstance], value),
      )
    )
      return node;
    const next = { ...node, ...updates };
    // A type change cannot silently hide or discard an existing subtree.
    if (getTypeChangeError(node, next.properties.type)) return node;
    if (canContainChildren(next.properties.type))
      return { ...next, children: next.children ?? [] };
    return { ...next, children: undefined };
  });

export const insertTreeNode = (
  nodes: ComponentInstance[],
  node: ComponentInstance,
  parentId?: string,
  index?: number,
): ComponentInstance[] => {
  const insert = (siblings: ComponentInstance[]) => {
    const next = [...siblings];
    next.splice(index ?? next.length, 0, { ...node, parent: parentId });
    return next;
  };
  return parentId
    ? updateTreeNode(nodes, parentId, (parent) =>
        canContainChildren(parent.properties.type)
          ? { ...parent, children: insert(parent.children ?? []) }
          : parent,
      )
    : insert(nodes);
};

const findNode = (
  nodes: ComponentInstance[],
  id: string,
): ComponentInstance | undefined => {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
    const found = node.children && findNode(node.children, id);
    if (found) {
      return found;
    }
  }
  return undefined;
};

export const moveTreeNode = (
  nodes: ComponentInstance[],
  dragId: string,
  hoverId: string,
  position: 'before' | 'after' | 'inside',
): ComponentInstance[] => {
  const dragged = findNode(nodes, dragId);
  const target = findNode(nodes, hoverId);
  if (
    !dragged ||
    !target ||
    dragId === hoverId ||
    findNode(dragged.children || [], hoverId)
  ) {
    return nodes;
  }
  if (position === 'inside' && !canContainChildren(target.properties.type)) {
    return nodes;
  }
  const remaining = updateTreeNode(nodes, dragId, () => null);
  if (position === 'inside') {
    return insertTreeNode(remaining, dragged, hoverId);
  }
  // Derive the destination parent from the tree, including imported configurations.
  const insertBeside = (
    siblings: ComponentInstance[],
    parentId?: string,
  ): ComponentInstance[] => {
    const index = siblings.findIndex((node) => node.id === hoverId);
    if (index >= 0) {
      const next = [...siblings];
      next.splice(index + (position === 'after' ? 1 : 0), 0, {
        ...dragged,
        parent: parentId,
      });
      return next;
    }
    let changed = false;
    const next = siblings.map((node) => {
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
