import React from 'react';
import type { ComponentInstance } from '../configuration/types';
import { useConfigRequirement } from '../runtime/formValuesStore';
import { getInjectedProps, reportRuntimeError, resolveFunction } from '../runtime/runtime';

/** 解析控件属性、运行时函数及注入数据，并持久化需保留的本地值。 */
export function useControlProps(
  component: ComponentInstance,
  onUpdateComponent: (id: string, updates: Partial<ComponentInstance>) => void,
) {
  /** 将 cProps JSON 解析为属性对象，非法输入暂用空对象。 */
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
  const configuredValidate = Object.hasOwn(parsedProps, 'validate') ? parsedProps.validate : properties.validate;
  const configuredInputFormat = Object.hasOwn(parsedProps, 'inputFormat') ? parsedProps.inputFormat : properties.inputFormat;
  const configuredOutputFormat = Object.hasOwn(parsedProps, 'outputFormat') ? parsedProps.outputFormat : properties.outputFormat;
  const configuredOnChangeState = Object.hasOwn(parsedProps, 'onChangeState') ? parsedProps.onChangeState : properties.onChangeState;

  /** 优先使用 cProps 中显式配置的函数，并为执行异常设置回退。 */
  const runtimeProps = React.useMemo(
    () => ({
      validate: resolveFunction(
        configuredValidate,
        `${properties.label || properties.path} 校验函数`,
        /** 校验函数执行失败时返回校验错误文案。 */
        () => '校验函数执行失败',
      ),
      inputFormat: resolveFunction(
        configuredInputFormat,
        '输入格式化',
        /** 输入格式化失败时保留原值。 */
        (value) => value,
      ),
      outputFormat: resolveFunction(
        configuredOutputFormat,
        '输出格式化',
        /** 输出格式化失败时保留原值。 */
        (value) => value,
      ),
      onChangeState: resolveFunction(
        configuredOnChangeState,
        '状态联动',
        /** 状态联动失败时不再产生额外修改。 */
        () => undefined,
      ),
    }),
    [
      configuredValidate,
      configuredInputFormat,
      configuredOutputFormat,
      configuredOnChangeState,
      properties.label,
      properties.path,
    ],
  );
  const [injectedProps, setInjectedProps] = React.useState<
    Record<string, unknown>
  >({});
  React.useEffect(
    /* 加载同步或异步注入属性，失效的异步结果不再写回组件。 */
    () => {
      // 切换注入配置或卸载后使旧 Promise 失效，防止迟到结果覆盖当前属性。
      let active = true;
      if (!properties.asyncInject) {
        setInjectedProps(
          /* 仅在存在旧注入值时清空，避免无变化的状态更新。 */
          (previous) =>
            Object.keys(previous).length ? {} : previous,
        );
        return;
      }
      try {
        const result = getInjectedProps(properties.asyncInject);
        if (result instanceof Promise) {
          result.then(
            /** 仅在本轮注入仍有效时应用异步返回值。 */
            (value) => {
              if (active) setInjectedProps(value);
            },
            /** 报告异步注入失败。 */
            (error) => reportRuntimeError('异步注入', error),
          );
        }
        else setInjectedProps(result);
      } catch (error) {
        reportRuntimeError('异步注入', error);
        setInjectedProps({});
      }
      /* 使本轮尚未返回的注入结果失效。 */
      return () => {
        active = false;
      };
    }, [properties.asyncInject]);
  /** 将上传和多语言类控件的当前值保存到 cProps.initValue。 */
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
      ) {
        return;
      }
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
