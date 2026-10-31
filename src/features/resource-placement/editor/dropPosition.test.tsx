// @vitest-environment jsdom
import React from 'react';
import { vi } from 'vitest';
const hooks = vi.hoisted(() => ({ spec: null as any }));
vi.mock('react-dnd', () => ({
  useDrag: () => [{ isDragging: false }, () => undefined],
  useDrop: (spec: any) => {
    hooks.spec = spec;
    return [{ isOver: false, dropPosition: 'after' }, () => undefined];
  },
}));
vi.mock('@douyinfe/semi-ui', () => ({
  Button: () => null,
  Popconfirm: () => null,
}));
vi.mock('./ComponentContent', () => ({ default: () => null }));
vi.mock('./formValuesStore', () => ({
  ComponentVisibility: ({ children }: any) => children,
}));
vi.mock('./selectionStore', () => ({ useNodeSelected: () => false }));
import { render, cleanup, act } from '@testing-library/react';
import ComponentRenderer from './ComponentRenderer';
import { getDropPosition } from './dropPosition';
import type { DragItem } from './types';
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
      onUpdateComponent={() => undefined}
      onRemoveComponent={() => undefined}
      onSelectComponent={() => undefined}
    />,
  );
  const element = result.container.firstElementChild as HTMLElement;
  let rect = bounds;
  element.getBoundingClientRect = () => ({
    ...rect,
    height: rect.bottom - rect.top,
    left: 0,
    right: 100,
    width: 100,
    x: 0,
    y: rect.top,
    toJSON: () => ({}),
  });
  let pointer: { x: number; y: number } | null = { x: 50, y: 270 };
  const monitor = {
    isOver: () => true,
    didDrop: () => false,
    getClientOffset: () => pointer,
  };
  return {
    onMove,
    onAddComponent,
    monitor,
    setPointer: (y: number | null) => {
      pointer = y === null ? null : { x: 50, y };
    },
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
    act(() => {
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
  act(() => {
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
  act(() => {
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
  act(() => {
    hooks.spec.drop(
      { type: 'existing-component', id: 'source' },
      fixture.monitor,
    );
  });
  expect(fixture.onMove).toHaveBeenCalledWith('source', 'target', 'after');
  act(() => {
    hooks.spec.drop(
      { type: 'component', componentType: 'Input' },
      fixture.monitor,
    );
  });
  expect(fixture.onAddComponent).toHaveBeenCalledWith('Input', 'target');
});
test('already-handled and self drops remain ignored', () => {
  const fixture = mount();
  act(() => {
    hooks.spec.drop(
      { type: 'existing-component', id: 'source' },
      { ...fixture.monitor, didDrop: () => true },
    );
    hooks.spec.drop(
      { type: 'existing-component', id: 'target' },
      fixture.monitor,
    );
  });
  expect(fixture.onMove).not.toHaveBeenCalled();
  expect(fixture.onAddComponent).not.toHaveBeenCalled();
});
