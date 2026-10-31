import type { ComponentType } from '../configuration/types';

export const layoutComponents: Record<string, ComponentType> = {
  // 布局组件
  Card: {
    type: 'Card',
    name: '卡片',
    icon: '🃏',
    category: 'layout',
    allowChildren: true,
    defaultProps: {
      type: 'Card',
      label: '卡片',
      cProps: JSON.stringify({
        title: '卡片标题',
        size: 'small'
      })
    }
  },
  Container: {
    type: 'Container',
    name: '容器',
    icon: '📦',
    category: 'layout',
    allowChildren: true,
    defaultProps: {
      type: 'Container',
      label: '容器'
    }
  },
  WrapContainer: {
    type: 'WrapContainer',
    name: '单行',
    icon: '📦',
    category: 'layout',
    allowChildren: true,
    defaultProps: {
      type: 'WrapContainer',
      label: '单行'
    }
  },
  ArrayContainer: {
    type: 'ArrayContainer',
    name: '数组',
    icon: '📋',
    category: 'layout',
    allowChildren: true,
    defaultProps: {
      type: 'ArrayContainer',
      label: '数组',
      cProps: JSON.stringify({
        addLabel: '添加',
        canSort: false
      })
    }
  }
};
