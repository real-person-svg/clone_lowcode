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
import { render, cleanup, act } from '@testing-library/react';
import { useFormApi } from '@douyinfe/semi-ui';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form/interface';
import ComponentContent from './ComponentContent';
import { CanvasForm } from './formValuesStore';
import {
  transformConfigToEditorData,
  transformEditorDataToConfig,
} from './dataTransform';
import type { ComponentInstance } from './types';
let api: FormApi;
const Bridge = () => {
  api = useFormApi();
  return null;
};
afterEach(cleanup);
async function mount(component: ComponentInstance) {
  await act(async () => {
    render(
      <CanvasForm>
        <Bridge />
        <ComponentContent
          component={component}
          onUpdateComponent={() => undefined}
          onRemoveComponent={() => undefined}
          onMove={() => undefined}
          onSelectComponent={() => undefined}
          onAddComponent={() => undefined}
        />
      </CanvasForm>,
    );
  });
}
async function valid() {
  let result = true;
  await act(async () => {
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
  await act(async () => {
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
  await act(async () => {
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
  await act(async () => {
    api.setValue('required', true);
  });
  expect(await valid()).toBe(false);
  await act(async () => {
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
  await act(async () => {
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
