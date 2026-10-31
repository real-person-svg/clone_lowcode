import React from 'react';
import { Tooltip } from '@douyinfe/semi-ui';
import { IconHelpCircleStroked } from '@douyinfe/semi-icons';

import { controlLib } from '@/components/controls';

import type { ComponentRendererProps } from './ComponentRenderer';
import ComponentRenderer from './ComponentRenderer';
import { COMPONENT_CONFIGS } from './componentConfigs';
import ErrorBoundary from './ErrorBoundary';
import { getIsDeepComponent } from './utils';
import { useRenderMetric } from './performance';

import styles from './style.module.scss';
import { useConfigRequirement } from './formValuesStore';
import {
  getInjectedProps,
  reportRuntimeError,
  resolveFunction,
} from './runtime';

// Selection and drag state belong to the shell; this subtree only receives content inputs.
const ComponentContent: React.FC<Omit<ComponentRendererProps, 'index'>> = ({
  component,
  fieldPrefix,
  onUpdateComponent,
  onRemoveComponent,
  onMove,
  onSelectComponent,
  onAddComponent,
}) => {
  useRenderMetric('content');
  const config =
    COMPONENT_CONFIGS[(component.properties.type || '').replace(/^Form/, '')];
  const parsedProps = React.useMemo(() => {
    try {
      const parsed: unknown = JSON.parse(component.properties.cProps || '{}');
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, any>)
        : {};
    } catch {
      return {};
    }
  }, [component.properties.cProps]);

  const { properties } = component;
  const required = useConfigRequirement(properties.require);
  const runtimeProps = React.useMemo(
    () => ({
      validate: resolveFunction(
        Object.hasOwn(parsedProps, 'validate')
          ? parsedProps.validate
          : properties.validate,
        `${properties.label || properties.path} 校验函数`,
        () => '校验函数执行失败',
      ),
      inputFormat: resolveFunction(
        Object.hasOwn(parsedProps, 'inputFormat')
          ? parsedProps.inputFormat
          : properties.inputFormat,
        '输入格式化',
        (value) => value,
      ),
      outputFormat: resolveFunction(
        Object.hasOwn(parsedProps, 'outputFormat')
          ? parsedProps.outputFormat
          : properties.outputFormat,
        '输出格式化',
        (value) => value,
      ),
      onChangeState: resolveFunction(
        Object.hasOwn(parsedProps, 'onChangeState')
          ? parsedProps.onChangeState
          : properties.onChangeState,
        '状态联动',
        () => undefined,
      ),
    }),
    [
      properties.validate,
      parsedProps.validate,
      properties.inputFormat,
      parsedProps.inputFormat,
      properties.outputFormat,
      parsedProps.outputFormat,
      properties.onChangeState,
      parsedProps.onChangeState,
      properties.label,
      properties.path,
    ],
  );
  const [injectedProps, setInjectedProps] = React.useState<
    Record<string, unknown>
  >({});
  React.useEffect(() => {
    let active = true;
    if (!properties.asyncInject) {
      setInjectedProps((previous) =>
        Object.keys(previous).length ? {} : previous,
      );
      return;
    }
    try {
      const result = getInjectedProps(properties.asyncInject);
      if (result instanceof Promise)
        result.then(
          (value) => {
            if (active) setInjectedProps(value);
          },
          (error) => reportRuntimeError('异步注入', error),
        );
      else setInjectedProps(result);
    } catch (error) {
      reportRuntimeError('异步注入', error);
      setInjectedProps({});
    }
    return () => {
      active = false;
    };
  }, [properties.asyncInject]);
  const preserveLocalValue = React.useCallback(
    (value: unknown) => {
      const type = properties.type?.replace(/^Form/, '');
      if (
        ![
          'Upload',
          'StarlingInput',
          'StarlingUpload',
          'StarlingSchema',
        ].includes(type || '')
      )
        return;
      onUpdateComponent(component.id, {
        properties: {
          ...properties,
          cProps: JSON.stringify({ ...parsedProps, initValue: value }),
        },
      });
    },
    [component.id, properties, parsedProps, onUpdateComponent],
  );
  let componentTyep = (properties.type || '').includes('Form')
    ? properties.type!
    : `Form${properties.type}`;
  // 原来的 ArrayContainer 组件不兼容无法用在低码里，转成对应的 FormColumnContainer 来渲染
  componentTyep =
    componentTyep === 'FormArrayContainer'
      ? 'FormColumnContainer'
      : componentTyep;
  const controlConfig = controlLib[componentTyep];
  if (!controlConfig) {
    return (
      <div className={styles.unknownComponent}>
        未知组件类型: {properties.type}
      </div>
    );
  }

  const { C: Component } = controlConfig;
  // 普通组件直接渲染
  let cProps = {
    label: {
      text: properties.label,
      required,
      extra: properties.tips ? (
        <Tooltip content={properties.tips}>
          <IconHelpCircleStroked style={{ color: '#8f959e' }} />
        </Tooltip>
      ) : null,
    },
  };
  try {
    cProps = {
      ...cProps,
      ...parsedProps,
    };
  } catch (e) {}

  // Preserve the source spread precedence: explicit cProps rules override node rules.
  // Semi retains its own custom-validate precedence over schema rules.
  const configuredRules = Object.hasOwn(parsedProps, 'rules')
    ? parsedProps.rules
    : properties.rules;
  const rules = [
    ...(required
      ? [
          {
            required: true,
            message: `${properties.label || properties.path}不能为空`,
          },
        ]
      : []),
    ...(Array.isArray(configuredRules) ? configuredRules : []),
  ];
  const field = fieldPrefix
    ? `${fieldPrefix}.${properties.path}`
    : properties.path;
  // 对于容器类组件，需要渲染子组件
  if (config?.allowChildren) {
    return (
      <Component
        field={field}
        {...cProps}
        rules={rules}
        {...runtimeProps}
        {...injectedProps}
      >
        {(component.children || []).map((child, childIndex) => (
          <ComponentRenderer
            key={child.id}
            component={child}
            index={childIndex}
            fieldPrefix={getIsDeepComponent(component) ? field : fieldPrefix}
            onUpdateComponent={onUpdateComponent}
            onRemoveComponent={onRemoveComponent}
            onMove={onMove}
            onSelectComponent={onSelectComponent}
            onAddComponent={onAddComponent}
          />
        ))}
      </Component>
    );
  }

  const resetKey = `${component.id}__${properties.type}`;
  return (
    <ErrorBoundary key={resetKey}>
      <Component
        field={field}
        {...cProps}
        rules={rules}
        {...runtimeProps}
        {...injectedProps}
        onLocalValueChange={preserveLocalValue}
      />
    </ErrorBoundary>
  );
};

export default React.memo(ComponentContent);
