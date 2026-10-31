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
