import { layoutComponents } from './layoutComponents';
import { inputComponents } from './inputComponents';
import { localizedComponents } from './localizedComponents';

export const COMPONENT_CONFIGS = { ...layoutComponents, ...inputComponents, ...localizedComponents };

export const componentOptions = Object.entries(COMPONENT_CONFIGS).map(
  /* 将组件默认标题和类型转换为属性面板选项。 */
  ([_key, config]) => ({
    label: config.defaultProps.label,
    value: config.defaultProps.type
  }));

/** 读取指定组件类型的某项默认属性。 */
export const getComponentDefaultConfig = (componentType: string, configKey: string) => {
  const targetComponent = Object.values(COMPONENT_CONFIGS).find(
    /** 匹配默认属性中声明的组件类型。 */
    (item) => item.defaultProps.type === componentType
  );
  return targetComponent?.defaultProps?.[configKey];
};
