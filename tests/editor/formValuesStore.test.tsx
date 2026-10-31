// @vitest-environment jsdom
import { vi } from 'vitest';
vi.hoisted(() => { HTMLCanvasElement.prototype.getContext=(() => ({fillStyle:'',fillRect(){},drawImage(){},measureText(){return {width:0};}})) as any; });
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

vi.spyOn(Toast,'error').mockImplementation(()=>'test-toast');

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
  const getter = vi.fn(() => true);
  store.publish({
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
const Probe = ({ name }: { name: keyof typeof commits }) => {
  React.useLayoutEffect(() => {
    commits[name]++;
  });
  return <span data-probe={name}>{name}</span>;
};
const ApiBridge = () => {
  api = useFormApi();
  return null;
};
const Field = withField(({ value, onChange }: any) => (
  <input value={value || ''} onChange={(e) => onChange(e.target.value)} />
));
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
beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  commits.ordinary = 0;
  commits.linked = 0;
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

test('real Semi initialization, field API, setValues override and reset preserve visibility with stable content', () => {
  act(() => root.render(<Fixture />));
  expect(container.querySelector('[data-probe="linked"]')).not.toBeNull();
  const previous = { ...commits };
  act(() => api.setValue('other', 'unrelated'));
  act(() => api.setValue('source', 'another truthy value'));
  expect(commits).toEqual(previous);
  act(() => api.setValues({ source: '' }, { isOverride: true }));
  expect(container.querySelector('[data-probe="linked"]')).toBeNull();
  act(() => api.reset());
  expect(container.querySelector('[data-probe="linked"]')).not.toBeNull();
  expect(commits.ordinary).toBe(previous.ordinary);
  expect(commits.linked).toBe(previous.linked + 1);
});

test('field registration/unregistration and expression edits update visibility', () => {
  const Host = ({ hasSource }: {hasSource:boolean}) => (
    <CanvasForm>
      <ApiBridge />
      {hasSource && <Field field="source" initValue="initial" />}
      <ComponentVisibility expression="({config}) => Boolean(config.source)">
        <Probe name="linked" />
      </ComponentVisibility>
    </CanvasForm>
  );
  act(() => root.render(<Host hasSource />));
  expect(container.querySelector('[data-probe="linked"]')).not.toBeNull();
  act(() => root.render(<Host hasSource={false} />));
  expect(container.querySelector('[data-probe="linked"]')).toBeNull();
  act(() => root.render(<Fixture expression="() => false" />));
  expect(container.querySelector('[data-probe="linked"]')).toBeNull();
  act(() => root.render(<Fixture expression="() => true" />));
  expect(container.querySelector('[data-probe="linked"]')).not.toBeNull();
});

test('nested fields and clearing a hidden field propagate to chained visibility', () => {
  act(() =>
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
  act(() => api.setValue('rows[0].enabled', ''));
  expect(api.getValue('dependent')).toBeUndefined();
  expect(container.querySelector('[data-probe="linked"]')).toBeNull();
});

test('adding and removing a truthy expression preserves the mounted field and its value', () => {
  const Host = ({ expression }: { expression?: string }) => (
    <CanvasForm>
      <ApiBridge />
      <ComponentVisibility expression={expression}>
        <Field field="dependent" />
      </ComponentVisibility>
    </CanvasForm>
  );
  act(() => root.render(<Host />));
  act(() => api.setValue('dependent', 'typed value'));
  const input = container.querySelector('input');
  act(() => root.render(<Host expression="() => true" />));
  expect(api.getValue('dependent')).toBe('typed value');
  expect(container.querySelector('input')).toBe(input);
  act(() => root.render(<Host />));
  expect(api.getValue('dependent')).toBe('typed value');
  expect(container.querySelector('input')).toBe(input);
});

test('keepState retains a hidden field value according to the original Semi configuration', () => {
  act(() =>
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
  act(() => api.setValue('dependent', 'retained'));
  act(() => api.setValue('source', ''));
  expect(api.getValue('dependent')).toBe('retained');
  act(() => api.setValue('source', 'yes'));
  expect(api.getValue('dependent')).toBe('retained');
});
