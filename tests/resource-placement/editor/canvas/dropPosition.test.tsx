// @vitest-environment jsdom
import React from 'react';
import { vi } from 'vitest';
const hooks = vi.hoisted(
  /* 提升共享拖放配置容器，供 mock 与用例交换当前目标规格。 */
  () => ({ spec: null as any }));
vi.mock('react-dnd',
  /* 替换拖放 Hook，以直接调用实际组件注册的放置逻辑。 */
  () => ({
    /* 返回固定的非拖动状态和空拖动连接器。 */
    useDrag: () => [{ isDragging: false },
    /* 测试不连接真实拖动 DOM。 */
    () => undefined],
    /* 保存放置规格，返回固定悬停状态和空连接器。 */
    useDrop: (spec: any) => {
      hooks.spec = spec;
      return [{ isOver: false, dropPosition: 'after' },
      /* 测试不连接真实放置 DOM。 */
      () => undefined];
    },
  }));
vi.mock('@douyinfe/semi-ui',
  /* 隐藏与放置位置计算无关的按钮和确认框。 */
  () => ({
    /* 测试不渲染操作按钮。 */
    Button: () => null,
    /* 测试不渲染删除确认框。 */
    Popconfirm: () => null,
  }));
vi.mock('../../../../src/resource-placement/editor/canvas/ComponentContent',
  /* 替换控件内容，隔离外层拖放逻辑。 */
  () => ({
    /* 测试无需渲染真实控件内容。 */
    default: () => null
  }));
vi.mock('../../../../src/resource-placement/editor/runtime/formValuesStore',
  /* 让可见性边界直接透传子节点，聚焦拖放。 */
  () => ({
    /* 不执行显隐规则，直接返回测试子节点。 */
    ComponentVisibility: ({ children }: any) => children,
  }));
vi.mock('../../../../src/resource-placement/editor/state/selectionStore',
  /* 让选择 Hook 返回未选中，避免渲染工具栏。 */
  () => ({
    /* 固定未选中状态。 */
    useNodeSelected: () => false
  }));
import { render, cleanup, act } from '@testing-library/react';
import ComponentRenderer from '../../../../src/resource-placement/editor/canvas/ComponentRenderer';
import { getDropPosition } from '../../../../src/resource-placement/editor/canvas/dropPosition';
import type { DragItem } from '../../../../src/resource-placement/editor/configuration/types';
afterEach(cleanup);
const bounds = { top: 216, bottom: 296 };

test.each([
  [224, false, 'before'],
  [256, false, 'after'],
  [295, false, 'after'],
  [225, true, 'before'],
  [226, true, 'inside'],
  [286, true, 'inside'],
  [287, true, 'after'],
] as const)(
  'pointer y=%s with container=%s resolves %s',
  (y, container, expected) => {
    expect(getDropPosition(bounds, { y }, container)).toBe(expected);
  },
);
test('missing pointer or node bounds has no inferred geometric position', () => {
  expect(getDropPosition(bounds, null, false)).toBeNull();
  expect(getDropPosition(null, { y: 224 }, true)).toBeNull();
});

/** 挂载真实节点外壳，并提供可调整的指针、矩形和拖放监控器。 */
function mount(type = 'FormInput') {
  const onMove = vi.fn(),
    onAddComponent = vi.fn();
  const result = render(
    <ComponentRenderer
      component={{
        id: 'target',
        parent: 'root',
        properties: { type, path: 'target', label: '目标' },
        ...(type === 'Container' ? { children: [] } : {}),
      }}
      index={2}
      onMove={onMove}
      onAddComponent={onAddComponent}
      onUpdateComponent={
        /* 本测试不处理组件属性更新。 */
        () => undefined}
      onRemoveComponent={
        /* 本测试不处理组件删除。 */
        () => undefined}
      onSelectComponent={
        /* 本测试不处理组件选择。 */
        () => undefined}
    />,
  );
  const element = result.container.firstElementChild as HTMLElement;
  let rect = bounds;
  element.getBoundingClientRect =
    /* 返回当前模拟矩形，使放下时可读取最新布局。 */
    () => ({
      ...rect,
      height: rect.bottom - rect.top,
      left: 0,
      right: 100,
      width: 100,
      x: 0,
      y: rect.top,
      /* 为模拟 DOMRect 提供序列化接口。 */
      toJSON: () => ({}),
    });
  let pointer: { x: number; y: number } | null = { x: 50, y: 270 };
  const monitor = {
    /* 模拟指针命中当前最内层目标。 */
    isOver: () => true,
    /* 默认子目标尚未处理本次放置。 */
    didDrop: () => false,
    /* 返回当前可由用例调整的指针位置。 */
    getClientOffset: () => pointer,
  };
  return {
    onMove,
    onAddComponent,
    monitor,
    /* 设置模拟指针纵坐标，null 表示无可用指针。 */
    setPointer: (y: number | null) => {
      pointer = y === null ? null : { x: 50, y };
    },
    /* 替换模拟目标矩形，验证布局变化后的实时计算。 */
    setRect: (value: typeof bounds) => {
      rect = value;
    },
  };
}

test.each([
  ['FormInput', 270, 224, 'before'],
  ['FormInput', 224, 290, 'after'],
  ['Container', 224, 260, 'inside'],
] as const)(
  'drop uses the current pointer before hover state commits: %s -> %s',
  (type, hoverY, dropY, expected) => {
    const fixture = mount(type);
    const spec = hooks.spec;
    const item: DragItem = { type: 'existing-component', id: 'source' };
    act(
      /* 同一轮中先悬停再放下，避免依赖 React 状态提交。 */
      () => {
        fixture.setPointer(hoverY);
        spec.hover(item, fixture.monitor);
        // No render/commit is allowed between hover and drop, matching the native backend handler.
        fixture.setPointer(dropY);
        spec.drop(item, fixture.monitor);
      });
    expect(fixture.onMove).toHaveBeenCalledWith('source', 'target', expected);
  },
);
test('drop remeasures moved target bounds instead of using the prior hover geometry', () => {
  const fixture = mount();
  const spec = hooks.spec;
  const item: DragItem = { type: 'existing-component', id: 'source' };
  act(
    /* 悬停后改变布局再放下，验证使用最新矩形。 */
    () => {
      fixture.setPointer(224);
      spec.hover(item, fixture.monitor);
      fixture.setRect({ top: 100, bottom: 180 });
      fixture.setPointer(150);
      spec.drop(item, fixture.monitor);
    });
  expect(fixture.onMove).toHaveBeenCalledWith('source', 'target', 'after');
});
test('palette insertion before a target works without any committed hover state', () => {
  const fixture = mount();
  fixture.setPointer(224);
  act(
    /* 模拟从组件库放置到叶子节点旁边。 */
    () => {
      hooks.spec.drop(
        { type: 'component', componentType: 'Input' },
        fixture.monitor,
      );
    });
  expect(fixture.onAddComponent).toHaveBeenCalledWith('Input', 'root', 2);
});
test('without an offset, existing nodes keep the explicit after fallback and palette containers use inside', () => {
  const fixture = mount('Container');
  fixture.setPointer(null);
  act(
    /* 无指针时放置现有组件，检查默认位置。 */
    () => {
      hooks.spec.drop(
        { type: 'existing-component', id: 'source' },
        fixture.monitor,
      );
    });
  expect(fixture.onMove).toHaveBeenCalledWith('source', 'target', 'after');
  act(
    /* 无指针时放置新组件，检查容器内部默认位置。 */
    () => {
      hooks.spec.drop(
        { type: 'component', componentType: 'Input' },
        fixture.monitor,
      );
    });
  expect(fixture.onAddComponent).toHaveBeenCalledWith('Input', 'target');
});
test('already-handled and self drops remain ignored', () => {
  const fixture = mount();
  act(
    /* 模拟子目标已处理的嵌套放置。 */
    () => {
      hooks.spec.drop(
        { type: 'existing-component', id: 'source' },
        {
          ...fixture.monitor,
          /* 标记本次放置已被子目标处理。 */
          didDrop: () => true
        },
      );
      hooks.spec.drop(
        { type: 'existing-component', id: 'target' },
        fixture.monitor,
      );
    });
  expect(fixture.onMove).not.toHaveBeenCalled();
  expect(fixture.onAddComponent).not.toHaveBeenCalled();
});
