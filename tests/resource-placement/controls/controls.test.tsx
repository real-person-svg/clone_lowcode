// @vitest-environment jsdom
import React from 'react';
import { vi } from 'vitest';
vi.hoisted(
  /* 提供组件依赖的尺寸观察器和 Canvas 最小替身，供 jsdom 挂载控件。 */
  () => {
    globalThis.ResizeObserver = class {
      /** 测试不依赖尺寸变化，观察操作无需执行。 */
      observe() { }
      /** 测试未注册真实尺寸监听，取消观察无需执行。 */
      unobserve() { }
      /** 测试未创建真实观察器资源，断开操作无需执行。 */
      disconnect() { }
    };
    HTMLCanvasElement.prototype.getContext = (
      /* 返回控件初始化所需的最小二维绘图上下文。 */
      () => ({
        fillStyle: '',
        /** 忽略测试中无需实际绘制的矩形操作。 */
        fillRect() { },
        /** 忽略测试中无需实际渲染的图片操作。 */
        drawImage() { },
        /** 提供固定文本宽度，满足控件测量接口。 */
        measureText() {
          return { width: 0 };
        },
      })) as any;
  });
import { render, fireEvent, cleanup, act } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Canvas from '../../../src/resource-placement/editor/canvas/Canvas';
import { createSelectionStore } from '../../../src/resource-placement/editor/state/selectionStore';
import { COMPONENT_CONFIGS } from '../../../src/resource-placement/editor/library/componentConfigs';
import type { ComponentInstance } from '../../../src/resource-placement/editor/configuration/types';
import { CAPCUT_LG } from '@/resource-placement/controls/localization';
/** 在拖放上下文中挂载画布，便于验证真实控件配置。 */
const mount = (components: ComponentInstance[], onUpdateComponent = vi.fn()) =>
  render(
    <DndProvider backend={HTML5Backend}>
      <Canvas
        components={components}
        selectionStore={createSelectionStore()}
        onSelectComponent={
          /* 本用例不处理组件选择变化。 */
          () => undefined}
        onUpdateComponent={onUpdateComponent}
        onRemoveComponent={
          /* 本用例不处理组件删除。 */
          () => undefined}
        onMoveComponent={
          /* 本用例不处理组件移动。 */
          () => undefined}
        onAddComponent={
          /* 本用例不处理组件添加。 */
          () => undefined}
      />
    </DndProvider>,
  );
afterEach(cleanup);
test('all 17 palette controls render through the real Semi form and local control registry', async () => {
  const nodes = Object.values(COMPONENT_CONFIGS).map(
    /* 将每种组件默认配置转换为可挂载的独立测试节点。 */
    (config, index) => ({
      id: `node${index}`,
      properties: { ...config.defaultProps, path: `field${index}` },
      ...(config.allowChildren ? { children: [] } : {}),
    }));
  let result!: ReturnType<typeof mount>;
  await act(
    /* 在 act 中完成画布挂载及相关状态更新。 */
    async () => {
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
  await act(
    /* 挂载带本地文案、变量和语言值的测试组件。 */
    async () => {
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
  await act(
    /* 模拟修改文案并等待 React 提交。 */
    async () => { fireEvent.change(input, { target: { value: 'new_title' } }); });
  const props = update.mock.lastCall![1].properties;
  expect(JSON.parse(props.cProps).initValue).toEqual({
    ...value,
    value: 'new_title',
  });
  expect(CAPCUT_LG).toHaveLength(31);
  expect(CAPCUT_LG.some(
    /* 查找简体中文选项，验证本地语言配置。 */
    (item) => item.value === 'zh-Hans')).toBe(true);
  expect(CAPCUT_LG.some(
    /* 查找日语选项，验证多语言列表内容。 */
    (item) => item.value === 'ja-JP')).toBe(true);
});
