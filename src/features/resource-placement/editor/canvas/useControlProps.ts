import React from 'react';
import type { ComponentInstance } from '../configuration/types';
import { useConfigRequirement } from '../runtime/formValuesStore';
import { getInjectedProps, reportRuntimeError, resolveFunction } from '../runtime/runtime';

export function useControlProps(
  component: ComponentInstance,
  onUpdateComponent: (id: string, updates: Partial<ComponentInstance>) => void,
) {
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

  return { properties, parsedProps, required, runtimeProps, injectedProps, preserveLocalValue };
}
