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

/** 创建表单值存储，以版本号通知原地对象变化。 */
export const createFormValuesStore = () => {
  let values: FormValues = {};
  let version = 0;
  const listeners = new Set<() => void>();
  return {
    /* 返回最近发布的完整表单值。 */
    getValues: () => values,
    /* 返回表单值的当前发布版本。 */
    getVersion: () => version,
    /* 订阅表单值变化，并返回取消订阅方法。 */
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      /* 移除当前表单值监听器。 */
      return () => {
        listeners.delete(listener);
      };
    },
    /* 发布完整表单值并递增版本，兼容 Semi 原地修改对象的行为。 */
    publish: (nextValues: FormValues) => {
      // Semi 会原地修改嵌套值及注销字段，不能依靠对象引用识别变化，需显式递增版本。
      values = nextValues;
      version++;
      listeners.forEach(
        /* 通知当前订阅者重新读取快照。 */
        (listener) => listener());
    }
  };
};

type FormValuesStore = ReturnType<typeof createFormValuesStore>;
const FormValuesContext = createContext<FormValuesStore | null>(null);

// 旧规则可动态取键、枚举或读取嵌套值，因此保留完整 config 输入，不推测局部依赖。
/** 编译条件表达式，生成按表单版本缓存并在异常时默认展示的快照读取器。 */
export const createVisibilitySnapshot = (store: FormValuesStore, expression: string | boolean) => {
  let evaluate: (state: { config: FormValues }) => unknown;
  try {

    const predicate = compileVisibilityFunction(expression);
    evaluate =
      /* 用完整配置对象调用已编译的条件函数。 */
      (state) => predicate?.(state);
  } catch (error) {
    reportRuntimeError('是否展示', error);
    evaluate =
      /* 表达式编译失败时默认展示。 */
      () => true;
  }
  let version = -1;
  let visible = true;
  // React 可能多次读取同一快照，按发布版本缓存规则结果，避免重复执行配置函数。
  /* 每个表单版本只计算一次条件结果，运行异常时默认展示。 */
  return () => {
    if (version !== store.getVersion()) {
      version = store.getVersion();
      recordLifecycleMetric('visibilityEvaluations');
      try {
        visible = Boolean(evaluate({ config: store.getValues() }));
      } catch (error) {
        reportRuntimeError('是否展示', error);
        // 规则异常时沿用默认展示策略，避免配置项因表达式错误而无法编辑。
        visible = true;
      }
    }
    return visible;
  };
};

/** 连接 Semi 表单状态与画布的外部值存储。 */
const FormValuesBridge = () => {
  const store = useContext(FormValuesContext);
  const formState = useFormState();
  // 字段注册、注销和重置不会触发 Semi 的 onValueChange；在绘制前发布已提交状态以覆盖这些变化。
  useLayoutEffect(
    /* 在布局提交时发布值，覆盖注册、卸载和重置等非输入变化。 */
    () => {
      store?.publish(formState.values);
    });
  return null;
};

/** 为画布创建独立表单及值存储上下文。 */
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

/** 为无条件节点提供空订阅，避免无关表单变化触发更新。 */
const subscribeToNothing = () =>
  /* 空订阅不需要释放资源。 */
  () => undefined;

/** 返回无条件节点的默认可见状态。 */
const alwaysVisible = () => true;

// 无条件节点不订阅表单；增删 isShow 时保留同一边界类型，避免可见字段重新注册而丢值。
/** 按表达式订阅可见性，只在结果变化时更新展示边界。 */
export const ComponentVisibility: React.FC<{ expression?: string | boolean; children: React.ReactNode }> = ({
  expression,
  children
}) => {
  const store = useContext(FormValuesContext);
  /** 表达式存在时创建条件快照，否则使用始终可见快照。 */
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

/** 为动态必填规则订阅表单值，静态规则直接读取布尔值。 */
export const useConfigRequirement = (expression?: boolean | string) => {
  const store = useContext(FormValuesContext);
  const dynamic = typeof expression === 'string' && Boolean(expression);
  /** 根据规则是否动态，选择条件快照或静态快照。 */
  const getSnapshot = useMemo(() => dynamic && store
    ? createVisibilitySnapshot(store, expression as string)
    :
    /* 返回静态必填规则的布尔结果。 */
    () => Boolean(expression), [store, expression, dynamic]);
  return useSyncExternalStore(dynamic && store ? store.subscribe : subscribeToNothing, getSnapshot, getSnapshot);
};
