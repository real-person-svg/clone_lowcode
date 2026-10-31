import React, {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore
} from 'react';
import { Form, useFormState } from '@douyinfe/semi-ui';

import { recordLifecycleMetric, useRenderMetric } from './performance';
import { compileVisibilityFunction, reportRuntimeError } from './runtime';

type FormValues = Record<string, unknown>;

export const createFormValuesStore = () => {
  let values: FormValues = {};
  let version = 0;
  const listeners = new Set<() => void>();
  return {
    getValues: () => values,
    getVersion: () => version,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    publish: (nextValues: FormValues) => {
      // Semi mutates values in place, including nested paths and field unregistration.
      values = nextValues;
      version++;
      listeners.forEach((listener) => listener());
    }
  };
};

type FormValuesStore = ReturnType<typeof createFormValuesStore>;
const FormValuesContext = createContext<FormValuesStore | null>(null);

// Keep the legacy full-config contract. Dynamic keys, enumeration and nested reads
// cannot safely be reduced to a guessed list of field dependencies.
export const createVisibilitySnapshot = (store: FormValuesStore, expression: string | boolean) => {
  let evaluate: (state: { config: FormValues }) => unknown;
  try {
    // eslint-disable-next-line no-eval -- Existing configurations store isShow as JavaScript source.
    const predicate = compileVisibilityFunction(expression);
    evaluate = (state) => predicate?.(state);
  } catch(error) {
    reportRuntimeError('是否展示',error);
    evaluate = () => true;
  }
  let version = -1;
  let visible = true;
  return () => {
    if (version !== store.getVersion()) {
      version = store.getVersion();
      recordLifecycleMetric('visibilityEvaluations');
      try {
        visible = Boolean(evaluate({ config: store.getValues() }));
      } catch(error) {
        reportRuntimeError('是否展示',error);
        // Match the editor's existing fail-open behavior for invalid expressions.
        visible = true;
      }
    }
    return visible;
  };
};

const FormValuesBridge = () => {
  const store = useContext(FormValuesContext);
  const formState = useFormState();
  // Observe committed state as well as user input: Semi does not emit onValueChange
  // on field registration/unregistration and reset. Publish before the browser paints.
  useLayoutEffect(() => {
    store?.publish(formState.values);
  });
  return null;
};

export const CanvasForm: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [store] = useState(createFormValuesStore);
  return (
    <FormValuesContext.Provider value={store}>
      <Form>
        <FormValuesBridge />
        {children}
      </Form>
    </FormValuesContext.Provider>
  );
};

const subscribeToNothing = () => () => undefined;
const alwaysVisible = () => true;

// Unconditional nodes have no value subscription. Keep one boundary type when
// isShow is added/removed so visible fields retain their value and registration.
export const ComponentVisibility: React.FC<{ expression?: string | boolean; children: React.ReactNode }> = ({
  expression,
  children
}) => {
  const store = useContext(FormValuesContext);
  const getSnapshot = useMemo(
    () => (expression !== undefined && expression !== '' ? createVisibilitySnapshot(store!, expression) : alwaysVisible),
    [store, expression]
  );
  const visible = useSyncExternalStore(
    expression !== undefined && expression !== '' ? store!.subscribe : subscribeToNothing,
    getSnapshot,
    getSnapshot
  );
  useRenderMetric('visibility');
  return visible ? <>{children}</> : null;
};

/** Only controls with a conditional requirement subscribe to preview values. */
export const useConfigRequirement = (expression?: boolean | string) => {
  const store=useContext(FormValuesContext);
  const dynamic=typeof expression === 'string' && Boolean(expression);
  const getSnapshot=useMemo(() => dynamic && store
    ? createVisibilitySnapshot(store,expression as string)
    : () => Boolean(expression),[store,expression,dynamic]);
  return useSyncExternalStore(dynamic && store ? store.subscribe : subscribeToNothing,getSnapshot,getSnapshot);
};
