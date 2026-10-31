import React from 'react';
import { Tooltip } from '@douyinfe/semi-ui';
import { IconHelpCircleStroked } from '@douyinfe/semi-icons';

import { controlLib } from '@/components/controls';

import type { ComponentRendererProps } from './ComponentRenderer';
import ComponentRenderer from './ComponentRenderer';
import { COMPONENT_CONFIGS } from '../library/componentConfigs';
import ErrorBoundary from './ErrorBoundary';
import { getIsDeepComponent } from '../configuration/utils';
import { useRenderMetric } from '../runtime/performance';

import styles from './style.module.scss';
import { useControlProps } from './useControlProps';

// 选中和拖动状态留在外壳，内容子树只接收实际控件输入，减少无关更新。
/** 渲染配置驱动的控件内容和子树，将选择与拖拽状态留在外壳。 */
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
  const {
    properties, parsedProps, required, runtimeProps, injectedProps, preserveLocalValue,
  } = useControlProps(component, onUpdateComponent);
  let componentType = (properties.type || '').includes('Form')
    ? properties.type!
    : `Form${properties.type}`;
  // 原来的 ArrayContainer 组件不兼容无法用在低码里，转成对应的 FormColumnContainer 来渲染
  componentType =
    componentType === 'FormArrayContainer'
      ? 'FormColumnContainer'
      : componentType;
  const controlConfig = controlLib[componentType];
  if (!controlConfig) {
    return (
      <div className={styles.unknownComponent}>
        未知组件类型: {properties.type}
      </div>
    );
  }

  const { C: Component } = controlConfig;
  // 普通组件直接渲染
  const cProps = {
    label: {
      text: properties.label,
      required,
      extra: properties.tips ? (
        <Tooltip content={properties.tips}>
          <IconHelpCircleStroked style={{ color: '#8f959e' }} />
        </Tooltip>
      ) : null,
    },
    ...parsedProps,
  };

  // cProps 显式提供的 rules（含 null）覆盖节点规则；自定义 validate 的优先级仍由 Semi 决定。
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
        {(component.children || []).map(/* 渲染容器子组件，数组容器使用当前字段作为子项前缀。 */ (child, childIndex) => (
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
