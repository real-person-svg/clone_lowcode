import type { ComponentType } from '../configuration/types';

export const localizedComponents: Record<string, ComponentType> = {
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
