// @vitest-environment jsdom
import { vi } from 'vitest';
vi.hoisted(/* 为依赖 Canvas 的表单控件提供 jsdom 绘图替身。 */ () => { HTMLCanvasElement.prototype.getContext=(/* 返回初始化控件所需的最小绘图 API。 */ () => ({fillStyle:'',/* 测试不执行真实矩形绘制。 */ fillRect(){},/* 测试不执行真实图片绘制。 */ drawImage(){},/* 返回固定文字宽度以满足控件测量。 */ measureText(){return {width:0};}})) as any; });
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { Toast, useFormApi, withField } from '@douyinfe/semi-ui';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form';

import {
  CanvasForm,
  ComponentVisibility,
  createFormValuesStore,
  createVisibilitySnapshot
} from '../../src/features/resource-placement/editor/runtime/formValuesStore';

vi.spyOn(Toast,'error').mockImplementation(/* 替代 Toast 返回稳定 ID，避免测试提示渲染干扰。 */ ()=>'test-toast');

test('snapshots support mutable nested values, dynamic keys, enumeration and replacement', () => {
  const store = createFormValuesStore();
  const values = { selector: 'rows', rows: [{ enabled: false }], other: 1 };
  const read = createVisibilitySnapshot(
    store,
    '({config}) => Object.keys(config).length > 0 && config[config.selector]?.[0]?.enabled'
  );
  store.publish(values);
  expect(read()).toBe(false);
  values.rows[0].enabled = true;
  store.publish(values);
  expect(read()).toBe(true);
  store.publish({});
  expect(read()).toBe(false);
});

test.each([
  ['({config}) => config.value', false],
  ['() => 0', false],
  ['() => ""', false],
  ['null', false],
  ['() => ({})', true],
  ['broken syntax (', true],
  ['() => {throw Error("invalid")}', true],
  ['true', true]
])('legacy truthiness and error handling: %s', (expression, expected) => {
  expect(createVisibilitySnapshot(createFormValuesStore(), expression)()).toBe(expected);
});

test('snapshot evaluation is cached per publication and listeners are released', () => {
  const store = createFormValuesStore();
  const getter = vi.fn(/* 固定返回可见，并记录快照计算次数。 */ () => true);
  store.publish({
    /** 通过 getter 记录规则对表单字段的读取次数。 */
    get visible() {
      return getter();
    }
  });
  const read = createVisibilitySnapshot(store, '({config}) => config.visible');
  expect(read()).toBe(true);
  expect(read()).toBe(true);
  expect(getter).toHaveBeenCalledTimes(1);
  const listener = vi.fn();
  const unsubscribe = store.subscribe(listener);
  store.publish({ visible: false });
  expect(read()).toBe(false);
  expect(listener).toHaveBeenCalledTimes(1);
  unsubscribe();
  store.publish({ visible: true });
  expect(listener).toHaveBeenCalledTimes(1);
});

let root: Root, container: HTMLDivElement, api: FormApi;
const commits = { ordinary: 0, linked: 0 };
/** 用提交计数探针观察指定子树是否重渲染。 */
const Probe = ({ name }: { name: keyof typeof commits }) => {
  React.useLayoutEffect(/* 每次提交后增加对应探针计数。 */ () => {
    commits[name]++;
  });
  return <span data-probe={name}>{name}</span>;
};
/** 从表单上下文取得 API，供用例触发非输入变化。 */
const ApiBridge = () => {
  api = useFormApi();
  return null;
};
const Field = withField(/* 提供最小受控输入字段，连接 Semi 表单和测试 DOM。 */ ({ value, onChange }: any) => (
  <input value={value || ''} onChange={/* 把 DOM 输入值传回表单字段。 */ (e) => onChange(e.target.value)} />
));
/** 构造带来源字段、条件字段和无条件探针的画布表单。 */
const Fixture = ({ expression = '({config}) => Boolean(config.source)' }) => (
  <CanvasForm>
    <ApiBridge />
    <Field field="source" initValue="initial" />
    <Field field="other" />
    <Probe name="ordinary" />
    <ComponentVisibility expression={expression}>
      <Probe name="linked" />
      <Field field="dependent" />
    </ComponentVisibility>
  </CanvasForm>
);
beforeEach(/* 启用 React 测试标记，创建容器、根节点并清空计数。 */ () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  commits.ordinary = 0;
  commits.linked = 0;
});
afterEach(/* 卸载组件并移除用例容器。 */ () => {
  act(/* 在 act 内完成表单卸载。 */ () => root.unmount());
  container.remove();
});

test('real Semi initialization, field API, setValues override and reset preserve visibility with stable content', () => {
  act(/* 挂载默认条件表单，检查初始可见性。 */ () => root.render(<Fixture />));
  expect(container.querySelector('[data-probe="linked"]')).not.toBeNull();
  const previous = { ...commits };
  act(/* 修改无关字段，验证可见结果未变化时不重渲染。 */ () => api.setValue('other', 'unrelated'));
  act(/* 修改来源为另一个真值，验证布尔结果缓存。 */ () => api.setValue('source', 'another truthy value'));
  expect(commits).toEqual(previous);
  act(/* 以覆盖方式清空来源字段，触发条件隐藏。 */ () => api.setValues({ source: '' }, { isOverride: true }));
  expect(container.querySelector('[data-probe="linked"]')).toBeNull();
  act(/* 重置表单，验证恢复初始显隐。 */ () => api.reset());
  expect(container.querySelector('[data-probe="linked"]')).not.toBeNull();
  expect(commits.ordinary).toBe(previous.ordinary);
  expect(commits.linked).toBe(previous.linked + 1);
});

test('field registration/unregistration and expression edits update visibility', () => {
  /** 按参数挂载或移除来源字段，验证字段注销通知。 */
  const Host = ({ hasSource }: {hasSource:boolean}) => (
    <CanvasForm>
      <ApiBridge />
      {hasSource && <Field field="source" initValue="initial" />}
      <ComponentVisibility expression="({config}) => Boolean(config.source)">
        <Probe name="linked" />
      </ComponentVisibility>
    </CanvasForm>
  );
  act(/* 挂载包含来源字段的表单。 */ () => root.render(<Host hasSource />));
  expect(container.querySelector('[data-probe="linked"]')).not.toBeNull();
  act(/* 移除来源字段，验证条件重新求值。 */ () => root.render(<Host hasSource={false} />));
  expect(container.querySelector('[data-probe="linked"]')).toBeNull();
  act(/* 将显隐规则切换为固定隐藏。 */ () => root.render(<Fixture expression="() => false" />));
  expect(container.querySelector('[data-probe="linked"]')).toBeNull();
  act(/* 将显隐规则切换为固定展示。 */ () => root.render(<Fixture expression="() => true" />));
  expect(container.querySelector('[data-probe="linked"]')).not.toBeNull();
});

test('nested fields and clearing a hidden field propagate to chained visibility', () => {
  act(/* 挂载嵌套数组字段和依赖其值的条件组件。 */ () =>
    root.render(
      <CanvasForm>
        <ApiBridge />
        <Field field="rows[0].enabled" initValue="yes" />
        <ComponentVisibility expression="({config}) => Boolean(config.rows?.[0]?.enabled)">
          <Field field="dependent" initValue="yes" />
        </ComponentVisibility>
        <ComponentVisibility expression="({config}) => Boolean(config.dependent)">
          <Probe name="linked" />
        </ComponentVisibility>
      </CanvasForm>
    )
  );
  expect(container.querySelector('[data-probe="linked"]')).not.toBeNull();
  act(/* 修改嵌套数组字段，验证原地变更仍触发规则计算。 */ () => api.setValue('rows[0].enabled', ''));
  expect(api.getValue('dependent')).toBeUndefined();
  expect(container.querySelector('[data-probe="linked"]')).toBeNull();
});

test('adding and removing a truthy expression preserves the mounted field and its value', () => {
  /** 按参数切换是否配置显隐表达式，检查字段身份稳定。 */
  const Host = ({ expression }: { expression?: string }) => (
    <CanvasForm>
      <ApiBridge />
      <ComponentVisibility expression={expression}>
        <Field field="dependent" />
      </ComponentVisibility>
    </CanvasForm>
  );
  act(/* 挂载不含显隐表达式的条件边界。 */ () => root.render(<Host />));
  act(/* 写入依赖字段，供之后检查值是否保留。 */ () => api.setValue('dependent', 'typed value'));
  const input = container.querySelector('input');
  act(/* 给已有边界添加恒真规则。 */ () => root.render(<Host expression="() => true" />));
  expect(api.getValue('dependent')).toBe('typed value');
  expect(container.querySelector('input')).toBe(input);
  act(/* 移除显隐规则，检查字段未重新注册。 */ () => root.render(<Host />));
  expect(api.getValue('dependent')).toBe('typed value');
  expect(container.querySelector('input')).toBe(input);
});

test('keepState retains a hidden field value according to the original Semi configuration', () => {
  act(/* 挂载来源字段及条件展示的真实控件。 */ () =>
    root.render(
      <CanvasForm>
        <ApiBridge />
        <Field field="source" initValue="yes" />
        <ComponentVisibility expression="({config}) => Boolean(config.source)">
          <Field field="dependent" keepState />
        </ComponentVisibility>
      </CanvasForm>
    )
  );
  act(/* 写入需在隐藏再展示后保留的字段值。 */ () => api.setValue('dependent', 'retained'));
  act(/* 清空来源以隐藏控件。 */ () => api.setValue('source', ''));
  expect(api.getValue('dependent')).toBe('retained');
  act(/* 恢复来源真值以再次展示控件。 */ () => api.setValue('source', 'yes'));
  expect(api.getValue('dependent')).toBe('retained');
});
