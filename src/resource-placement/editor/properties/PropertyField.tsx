import React from 'react';
import { Typography, Tooltip } from '@douyinfe/semi-ui';
import { IconHelpCircleStroked } from '@douyinfe/semi-icons';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form/interface';
import type { ComponentInstance, PropertyConfig } from '../configuration/types';

const { Text } = Typography;

/** 根据属性定义渲染字段、必填规则和提示，绑定独立代码文档。 */
export default function PropertyField({ property, displayedComponent, form }: {
  property: PropertyConfig;
  displayedComponent: ComponentInstance;
  form: React.MutableRefObject<FormApi<PropertyConfig> | null>;
}) {
  const {
    key,
    label,
    require,
    tips,
    placeholder,
    disabled,
    props,
    component: Component,
  } = property;

  if (!key || !Component) return null;
  const rules = [];
  if (require) {
    rules.push({ required: true, message: `${label}不能为空` });
  }

  let fieldLabel: React.ReactNode | { text: string | undefined; extra: React.ReactNode } = label;
  if (tips) {
    fieldLabel = {
      text: label,
      extra: <Tooltip content={tips}><IconHelpCircleStroked style={{ color: '#8f959e' }} /></Tooltip>,
    };
  }
  const documentProps: Record<string, unknown> = {};
  if (key === 'cProps') {
    documentProps.componentId = `${displayedComponent.id}__${displayedComponent.properties.type}__${key}`;
    documentProps.documentValue = displayedComponent.properties.cProps ?? '';
  }

  const change = (newValue: any) => props?.onChange?.(newValue, form);

  return (
    <div key={key} style={{ marginBottom: 16 }}>
      <Component
        label={fieldLabel}
        field={key}
        rules={rules}
        disabled={disabled}
        placeholder={placeholder}
        {...documentProps}
        style={{ width: '100%' }}
        {...props}
        onChange={change}
      />
      {key === 'type' && Boolean(displayedComponent.children?.length) && (
        <Text type="secondary" size="small">
          当前组件包含子组件，请先移出或删除子组件后再切换为非容器类型
        </Text>
      )}
    </div>
  );
}
