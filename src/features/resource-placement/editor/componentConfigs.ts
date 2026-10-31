import { ComponentType } from './types';

/**
 * 简化后的组件配置
 * 移除了重复的propertySchema，改为使用统一的属性配置系统
 */
export const COMPONENT_CONFIGS: Record<string, ComponentType> = {
  // 布局组件
  Card: {
    type: 'Card',
    name: '卡片',
    icon: '🃏',
    category: 'layout',
    allowChildren: true,
    defaultProps: {
      type: 'Card',
      label: '卡片',
      cProps: JSON.stringify({
        title: '卡片标题',
        size: 'small'
      })
    }
  },
  Container: {
    type: 'Container',
    name: '容器',
    icon: '📦',
    category: 'layout',
    allowChildren: true,
    defaultProps: {
      type: 'Container',
      label: '容器'
    }
  },
  WrapContainer: {
    type: 'WrapContainer',
    name: '单行',
    icon: '📦',
    category: 'layout',
    allowChildren: true,
    defaultProps: {
      type: 'WrapContainer',
      label: '单行'
    }
  },
  ArrayContainer: {
    type: 'ArrayContainer',
    name: '数组',
    icon: '📋',
    category: 'layout',
    allowChildren: true,
    defaultProps: {
      type: 'ArrayContainer',
      label: '数组',
      cProps: JSON.stringify({
        addLabel: '添加',
        canSort: false
      })
    }
  },

  // 输入控件
  Input: {
    type: 'Input',
    name: '输入框',
    icon: '📝',
    category: 'input',
    allowChildren: false,
    defaultProps: {
      type: 'FormInput',
      label: '输入框',
      cProps: JSON.stringify({
        placeholder: '请输入'
      })
    }
  },

  Select: {
    type: 'Select',
    name: '选择器',
    icon: '📋',
    category: 'input',
    allowChildren: false,
    defaultProps: {
      type: 'FormSelect',
      label: '选择器',
      cProps: JSON.stringify({
        optionList: [{ label: 'demo', value: 'demo' }],
        placeholder: '请选择'
      })
    }
  },

  Switch: {
    type: 'Switch',
    name: '开关',
    icon: '🔘',
    category: 'input',
    allowChildren: false,
    defaultProps: {
      type: 'FormSwitch',
      label: '开关'
    }
  },

  DatePicker: {
    type: 'DatePicker',
    name: '日期选择器',
    icon: '📅',
    category: 'input',
    allowChildren: false,
    defaultProps: {
      type: 'FormDatePicker',
      label: '日期选择器',
      cProps: JSON.stringify({
        type: 'dateTime',
        density: 'compact',
        format: 'yyyy-MM-dd HH:mm:ss'
      })
    }
  },

  CheckboxGroup: {
    type: 'CheckboxGroup',
    name: '复选框',
    icon: '☑️',
    category: 'input',
    allowChildren: false,
    defaultProps: {
      type: 'FormCheckboxGroup',
      label: '复选框',
      cProps: JSON.stringify({
        options: [{ label: 'demo', value: 'demo' }]
      })
    }
  },

  RadioGroup: {
    type: 'RadioGroup',
    name: '单选框',
    icon: '🔘',
    category: 'input',
    allowChildren: false,
    defaultProps: {
      type: 'FormRadioGroup',
      label: '单选框',
      cProps: JSON.stringify({
        options: [{ label: 'demo', value: 'demo' }],
        type: 'button'
      })
    }
  },

  InputNumber: {
    type: 'InputNumber',
    name: '数字输入框',
    icon: '🔢',
    category: 'input',
    allowChildren: false,
    defaultProps: {
      type: 'FormInputNumber',
      label: '数字输入框',
      cProps: JSON.stringify({
        min: '1',
        canInputZero: 'false',
        innerButtons: true,
        placeholder: '请输入'
      })
    }
  },

  ColorPicker: {
    type: 'ColorPicker',
    name: '颜色选择器',
    icon: '🎨',
    category: 'input',
    allowChildren: false,
    defaultProps: {
      type: 'FormColorPicker',
      label: '颜色选择器'
    }
  },

  Upload: {
    type: 'Upload',
    name: '上传',
    icon: '📁',
    category: 'input',
    allowChildren: false,
    defaultProps: {
      type: 'FormUpload',
      label: '上传',
      inputFormat: 'val => (val ? [val] : [])',
      outputFormat: 'val => val[0]',
      cProps: JSON.stringify({
        type: 'image',
        limit: 1,
        listType: 'picture'
      })
    }
  },

  InputTagPanel: {
    type: 'InputTagPanel',
    name: '标签输入框',
    icon: '🏷️',
    category: 'input',
    allowChildren: false,
    defaultProps: {
      type: 'FormInputTagPanel',
      label: '标签输入框',
      cProps: JSON.stringify({
        placeholder: '多个值通过英文逗号分割',
        isRowDirection: true,
        separator: [',', ';']
      })
    }
  },

  StarlingInput: {
    type: 'StarlingInput',
    name: '多语言输入',
    icon: '🌍',
    category: 'input',
    allowChildren: false,
    defaultProps: {
      type: 'FormStarlingInput',
      label: '多语言输入',
      cProps: JSON.stringify({
        initValue: {
          $fieldType: 'STARLING_FIELD',
          type: 'STARLING',
          value: '',
          variables: []
        }
      })
    }
  },

  StarlingUpload: {
    type: 'StarlingUpload',
    name: '多语言/地区上传',
    icon: '🌍📁',
    category: 'input',
    allowChildren: false,
    defaultProps: {
      type: 'FormStarlingUpload',
      label: '多语言/地区上传',
      asyncInject: ['regionList', '({ regionList }) => ({ optionList: regionList })'],
      cProps: JSON.stringify({
        type: 'image',
        limit: 1,
        listType: 'picture'
      })
    }
  },

  StarlingSchema: {
    type: 'StarlingSchema',
    name: '多语言/地区链接输入',
    icon: '🔗',
    category: 'input',
    allowChildren: false,
    defaultProps: {
      type: 'FormStarlingSchema',
      label: '多语言/地区链接输入',
      asyncInject: ['regionList', '({ regionList }) => ({ optionList: regionList })']
    }
  }
};

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
