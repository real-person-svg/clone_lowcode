// @vitest-environment jsdom
import React from 'react';
import { vi } from 'vitest';
vi.hoisted(
  /* 补齐 jsdom 的尺寸观察和绘图 API，供真实控件挂载。 */
  () => {
    globalThis.ResizeObserver = class {
      /** 尺寸变化不影响本测试，忽略观察。 */
      observe() { }
      /** 测试没有真实尺寸订阅，忽略取消观察。 */
      unobserve() { }
      /** 测试没有真实观察资源，忽略断开。 */
      disconnect() { }
    };
    HTMLCanvasElement.prototype.getContext = (
      /* 提供最小 Canvas 二维上下文替身。 */
      () => ({
        fillStyle: '',
        /** 忽略无关的矩形绘制。 */
        fillRect() { },
        /** 忽略无关的图片绘制。 */
        drawImage() { },
        /** 固定文字宽度，满足控件测量接口。 */
        measureText() {
          return { width: 0 };
        },
      })) as any;
  });
import { render, cleanup, act } from '@testing-library/react';
import { useFormApi } from '@douyinfe/semi-ui';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form/interface';
import ComponentContent from '../../../../src/resource-placement/editor/canvas/ComponentContent';
import { CanvasForm } from '../../../../src/resource-placement/editor/runtime/formValuesStore';
import {
  transformConfigToEditorData,
  transformEditorDataToConfig,
} from '../../../../src/resource-placement/editor/configuration/dataTransform';
import type { ComponentInstance } from '../../../../src/resource-placement/editor/configuration/types';
let api: FormApi;
/** 读取当前 Semi 表单 API，供规则断言使用。 */
const Bridge = () => {
  api = useFormApi();
  return null;
};
afterEach(cleanup);
/** 在画布表单中挂载组件内容并等待初始化完成。 */
async function mount(component: ComponentInstance) {
  await act(
    /* 在 act 中挂载表单、API 桥接器及组件。 */
    async () => {
      render(
        <CanvasForm>
          <Bridge />
          <ComponentContent
            component={component}
            onUpdateComponent={
              /* 本测试不处理属性更新。 */
              () => undefined}
            onRemoveComponent={
              /* 本测试不处理组件删除。 */
              () => undefined}
            onMove={
              /* 本测试不处理组件移动。 */
              () => undefined}
            onSelectComponent={
              /* 本测试不处理组件选择。 */
              () => undefined}
            onAddComponent={
              /* 本测试不处理组件添加。 */
              () => undefined}
          />
        </CanvasForm>,
      );
    });
}
/** 运行表单校验，将拒绝结果转换为布尔断言值。 */
async function valid() {
  let result = true;
  await act(
    /* 等待异步校验结束并捕获不通过结果。 */
    async () => {
      try {
        await api.validate();
      } catch {
        result = false;
      }
    });
  return result;
}
const emailRule = { type: 'email', message: '必须是邮箱' };

test('top-level rules reject invalid email before and after save/reopen', async () => {
  const config = {
    content: [
      {
        type: 'FormInput',
        path: 'config.mail',
        label: '邮箱',
        rules: [emailRule],
        cProps: { initValue: 'invalid-email' },
      },
    ],
  };
  const first = transformConfigToEditorData(JSON.stringify(config));
  await mount(first[0]);
  expect(await valid()).toBe(false);
  cleanup();
  const reopened = transformConfigToEditorData(
    JSON.stringify(transformEditorDataToConfig(first)),
  );
  await mount(reopened[0]);
  expect(await valid()).toBe(false);
  await act(
    /* 填入合法邮箱，验证配置规则允许通过。 */
    async () => {
      api.setValue('mail', 'hello@example.com');
    });
  expect(await valid()).toBe(true);
});
test('explicit cProps rules retain source override precedence over node rules', async () => {
  const [node] = transformConfigToEditorData(
    JSON.stringify({
      content: [
        {
          type: 'FormInput',
          path: 'config.link',
          label: '链接',
          rules: [emailRule],
          cProps: {
            initValue: 'https://example.com',
            rules: [{ type: 'url', message: '必须是链接' }],
          },
        },
      ],
    }),
  );
  await mount(node);
  expect(await valid()).toBe(true);
  await act(
    /* 写入不符合自定义校验的链接值。 */
    async () => {
      api.setValue('link', 'invalid');
    });
  expect(await valid()).toBe(false);
});
test('dynamic requirement combines with node rules while custom validate keeps Semi precedence', async () => {
  const [node] = transformConfigToEditorData(
    JSON.stringify({
      content: [
        {
          type: 'FormInput',
          path: 'config.mail',
          label: '邮箱',
          require: '({config}) => config.required',
          rules: [emailRule],
        },
      ],
    }),
  );
  await mount(node);
  expect(await valid()).toBe(true);
  await act(
    /* 打开动态必填条件。 */
    async () => {
      api.setValue('required', true);
    });
  expect(await valid()).toBe(false);
  await act(
    /* 填入有效邮箱以满足必填规则。 */
    async () => {
      api.setValue('mail', 'hello@example.com');
    });
  expect(await valid()).toBe(true);
  cleanup();
  const custom = {
    ...node,
    properties: {
      ...node.properties,
      validate: 'value => value === "custom" ? "" : "自定义校验失败"',
      cProps: JSON.stringify({ initValue: 'custom' }),
    },
  };
  await mount(custom);
  expect(await valid()).toBe(true);
  await act(
    /* 输入合法邮箱但不满足自定义规则的值，验证自定义校验优先。 */
    async () => {
      api.setValue('mail', 'hello@example.com');
    });
  expect(await valid()).toBe(false);
});

test('explicit null cProps overrides retain the source rule and custom-validate precedence', async () => {
  const [node] = transformConfigToEditorData(
    JSON.stringify({
      content: [
        {
          type: 'FormInput',
          path: 'config.mail',
          label: '邮箱',
          rules: [emailRule],
          cProps: { initValue: 'invalid-email', rules: null },
        },
      ],
    }),
  );
  await mount(node);
  expect(await valid()).toBe(true);
  cleanup();
  const explicitRules = {
    ...node,
    properties: {
      ...node.properties,
      validate: '() => "自定义错误"',
      cProps: JSON.stringify({
        initValue: 'hello@example.com',
        validate: null,
      }),
    },
  };
  await mount(explicitRules);
  expect(await valid()).toBe(true);
});
