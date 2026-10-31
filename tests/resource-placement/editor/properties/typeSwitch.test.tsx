// @vitest-environment jsdom
import React from 'react';
import { vi } from 'vitest';
vi.hoisted(
  /* 提供真实属性面板依赖的尺寸观察器及 Canvas 替身。 */
  () => {
    globalThis.ResizeObserver = class {
      /** 测试不观察真实尺寸变化。 */
      observe() { }
      /** 测试无需取消真实尺寸观察。 */
      unobserve() { }
      /** 测试无需释放真实观察器资源。 */
      disconnect() { }
    };
    HTMLCanvasElement.prototype.getContext = (
      /* 返回最小 Canvas 二维上下文替身。 */
      () => ({
        fillStyle: '',
        /** 忽略无关的矩形绘制。 */
        fillRect() { },
        /** 忽略无关的图片绘制。 */
        drawImage() { },
        /** 返回固定文字宽度以满足测量接口。 */
        measureText() {
          return { width: 0 };
        },
      })) as any;
  });
vi.mock('../../../../src/resource-placement/editor/code/CodeEditor',
  /* 以普通表单输入替代 Monaco 字段，聚焦组件类型切换。 */
  async () => {
    const { Form } = await import('@douyinfe/semi-ui');
    return {
      /* 忽略代码文档专属属性，仅渲染表单输入。 */
      FormCodeEditor: ({ componentId, documentValue, ...props }: any) => (
        <Form.Input {...props} />
      ),
    };
  });
import { render, cleanup, act, fireEvent } from '@testing-library/react';
import PropertyPanel from '../../../../src/resource-placement/editor/properties/PropertyPanel';
import { patchTreeNode, insertTreeNode } from '../../../../src/resource-placement/editor/state/componentTree';
import {
  transformEditorDataToConfig,
  transformConfigToEditorData,
} from '../../../../src/resource-placement/editor/configuration/dataTransform';
import { PropertyConfigManager } from '../../../../src/resource-placement/editor/properties/PropertyConfigManager';
import type { ComponentInstance } from '../../../../src/resource-placement/editor/configuration/types';
const leaf: ComponentInstance = {
  id: 'leaf',
  properties: { type: 'FormInput', path: 'title', label: '标题' },
};
afterEach(cleanup);
let current: ComponentInstance;
/** 持有测试组件树并将属性面板更新应用回当前节点。 */
const Host = ({ initial }: { initial: ComponentInstance }) => {
  const [nodes, setNodes] = React.useState([initial]);
  current = nodes[0];
  return (
    <PropertyPanel
      selectedComponent={nodes[0]}
      onUpdateComponent={
        /* 将面板的节点补丁提交到测试状态。 */
        (id, updates) =>
          setNodes(
            /* 基于最新树应用补丁，避免使用旧状态。 */
            (previous) => patchTreeNode(previous, id, updates))
      }
    />
  );
};
/** 在属性面板中定位组件类型选择器。 */
const typeSelect = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('.semi-form-field'))
    .find(
      /* 通过字段标签定位类型字段。 */
      (field) =>
        field.querySelector('label')?.textContent?.includes('组件类型'),
    )!
    .querySelector('.semi-select')!;
/** 打开类型下拉框并选择指定文案对应的选项。 */
async function selectType(container: HTMLElement, label: string) {
  await act(
    /* 点击组件类型选择器展开选项。 */
    async () => {
      fireEvent.click(typeSelect(container));
    });
  const option = Array.from(
    document.querySelectorAll('.semi-select-option'),
  ).find(
    /* 查找目标类型的下拉选项。 */
    (item) => item.textContent === label)!;
  expect(option).toBeTruthy();
  await act(
    /* 点击目标选项并等待表单状态同步。 */
    async () => {
      fireEvent.click(option);
    });
}

test('real property type selection converts leaf to empty container and an empty container back to leaf', async () => {
  let result!: ReturnType<typeof render>;
  await act(
    /* 挂载初始叶子组件的属性面板。 */
    async () => {
      result = render(<Host initial={leaf} />);
    });
  await selectType(result.container, '容器');
  expect(current.properties.type).toBe('Container');
  expect(current.children).toEqual([]);
  const reloaded = transformConfigToEditorData(
    JSON.stringify(transformEditorDataToConfig([current])),
  );
  expect(reloaded[0].children).toEqual([]);
  await selectType(result.container, '输入框');
  expect(current.properties.type).toBe('FormInput');
  expect(current.children).toBeUndefined();
  expect(
    /* 导出切换结果，验证树结构合法。 */
    () => transformEditorDataToConfig([current])).not.toThrow();
});
test('a populated container keeps its children, disables leaf choices and explains the action', async () => {
  const initial = insertTreeNode(
    [
      {
        ...leaf,
        properties: { ...leaf.properties, type: 'Container' },
        children: [],
      },
    ],
    {
      id: 'child',
      properties: { type: 'FormInput', path: 'child', label: '子项' },
    },
    'leaf',
  )[0];
  let result!: ReturnType<typeof render>;
  await act(
    /* 挂载含子节点的容器，检查切换限制。 */
    async () => {
      result = render(<Host initial={initial} />);
    });
  expect(result.container.textContent).toContain('请先移出或删除子组件');
  const options = PropertyConfigManager.getBaseProperties(current).find(
    /** 定位基础属性中的组件类型定义。 */
    (field) => field.key === 'type',
  )!.props!.optionList!;
  expect(options.find(
    /* 查找非容器输入类型，检查选项禁用状态。 */
    (option) => option.value === 'FormInput')?.disabled).toBe(
      true,
    );
  expect(options.find(
    /* 查找仍允许保留子树的卡片类型。 */
    (option) => option.value === 'Card')?.disabled).toBe(
      false,
    );
  await selectType(result.container, '输入框');
  expect(current.properties.type).toBe('Container');
  expect(current.children).toHaveLength(1);
  const reopened = transformConfigToEditorData(
    JSON.stringify(transformEditorDataToConfig([current])),
  );
  expect(reopened[0].children).toHaveLength(1);
});
