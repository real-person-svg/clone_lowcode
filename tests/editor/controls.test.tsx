// @vitest-environment jsdom
import React from 'react';
import { vi } from 'vitest';
vi.hoisted(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  HTMLCanvasElement.prototype.getContext = (() => ({
    fillStyle: '',
    fillRect() {},
    drawImage() {},
    measureText() {
      return { width: 0 };
    },
  })) as any;
});
import { render, fireEvent, cleanup, act } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Canvas from '../../src/features/resource-placement/editor/canvas/Canvas';
import { createSelectionStore } from '../../src/features/resource-placement/editor/state/selectionStore';
import { COMPONENT_CONFIGS } from '../../src/features/resource-placement/editor/library/componentConfigs';
import type { ComponentInstance } from '../../src/features/resource-placement/editor/configuration/types';
import { CAPCUT_LG } from '@/components/controls/localization';
const mount = (components: ComponentInstance[], onUpdateComponent = vi.fn()) =>
  render(
    <DndProvider backend={HTML5Backend}>
      <Canvas
        components={components}
        selectionStore={createSelectionStore()}
        onSelectComponent={() => undefined}
        onUpdateComponent={onUpdateComponent}
        onRemoveComponent={() => undefined}
        onMoveComponent={() => undefined}
        onAddComponent={() => undefined}
      />
    </DndProvider>,
  );
afterEach(cleanup);
test('all 17 palette controls render through the real Semi form and local control registry', async () => {
  const nodes = Object.values(COMPONENT_CONFIGS).map((config, index) => ({
    id: `node${index}`,
    properties: { ...config.defaultProps, path: `field${index}` },
    ...(config.allowChildren ? { children: [] } : {}),
  }));
  let result!: ReturnType<typeof mount>;
  await act(async () => {
    result = mount(nodes);
  });
  const { container } = result;
  expect(container.textContent).not.toContain('未知组件类型');
  expect(container.textContent).not.toContain('组件预览失败');
  expect(
    container.querySelectorAll('.semi-form-field').length,
  ).toBeGreaterThanOrEqual(17);
});
test('editing local Starling content preserves variables and language values in saved component props', async () => {
  const update = vi.fn();
  const value = {
    $fieldType: 'STARLING_FIELD',
    type: 'STARLING',
    value: 'title',
    variables: [{ key: 'name', value: 'x' }],
    languages: { 'zh-Hans': '标题', en: 'Title' },
  };
  let result!: ReturnType<typeof mount>;
  await act(async () => {
    result = mount(
      [
        {
          id: 'local',
          properties: {
            type: 'FormStarlingInput',
            path: 'title',
            label: '标题',
            cProps: JSON.stringify({ initValue: value }),
          },
        },
      ],
      update,
    );
  });
  const { container } = result;
  const input = container.querySelector(
    'input[placeholder="请输入本地 starling key"]',
  )!;
  await act(async () => {fireEvent.change(input, { target: { value: 'new_title' } });});
  const props = update.mock.lastCall![1].properties;
  expect(JSON.parse(props.cProps).initValue).toEqual({
    ...value,
    value: 'new_title',
  });
  expect(CAPCUT_LG).toHaveLength(31);
  expect(CAPCUT_LG.some((item) => item.value === 'zh-Hans')).toBe(true);
  expect(CAPCUT_LG.some((item) => item.value === 'ja-JP')).toBe(true);
});
