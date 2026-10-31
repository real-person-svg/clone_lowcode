import type { ComponentInstance } from '../configuration/types';

export function getControlType(type?: string) {
  const currentType = type || '';
  const fieldType = currentType.includes('Form') ? type! : `Form${type}`;
  return fieldType === 'FormArrayContainer' ? 'FormColumnContainer' : fieldType;
}

export function getControlRules(component: ComponentInstance, parsedProps: Record<string, any>, required: boolean) {
  const { properties } = component;
  const configuredRules = Object.hasOwn(parsedProps, 'rules') ? parsedProps.rules : properties.rules;
  const rules = [];
  if (required) {
    rules.push({ required: true, message: `${properties.label || properties.path}不能为空` });
  }
  if (Array.isArray(configuredRules)) rules.push(...configuredRules);

  return rules;
}
