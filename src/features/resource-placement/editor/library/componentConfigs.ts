import { layoutComponents } from './layoutComponents';
import { inputComponents } from './inputComponents';
import { localizedComponents } from './localizedComponents';

export const COMPONENT_CONFIGS = { ...layoutComponents, ...inputComponents, ...localizedComponents };


export const componentOptions = Object.entries(COMPONENT_CONFIGS).map(([key, config]) => ({
  label: config.defaultProps.label,
  value: config.defaultProps.type
}));

export const getComponentDefaultConfig = (componentType: string, configKey: string) => {
  const targetComponent = Object.values(COMPONENT_CONFIGS).find(
    (item) => item.defaultProps.type === componentType
  );
  return targetComponent?.defaultProps?.[configKey];
};
