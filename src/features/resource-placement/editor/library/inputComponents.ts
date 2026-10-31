import type { ComponentType } from '../configuration/types';

export const inputComponents: Record<string, ComponentType> = {
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
  }
};
