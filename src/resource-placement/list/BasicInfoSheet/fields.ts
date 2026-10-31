import { fieldLabel } from '../FieldLabel';

export const basicFields = {
  resourceKey: {
    label: fieldLabel('资源位Key', true), rules: [
      { required: true, message: '请输入资源位Key' },
      {
        pattern: /^[a-zA-Z0-9_-]+$/,
        message: '只能包含字母、数字、下划线和横线'
      }
    ]
  },
  bizId: { label: fieldLabel('业务线', true), rules: [{ required: true, message: '请选择业务线' }] },
  directoryPath: { label: fieldLabel('资源位二级目录', true), rules: [{ required: true, message: '请输入二级目录名称' }] },
  resourceName: { label: fieldLabel('资源位名称', true), rules: [{ required: true, message: '请输入资源位名称' }] },
  version: {
    label: fieldLabel('资源位子版本', true), rules: [
      { required: true, message: '请输入资源位子版本' },
      {
        pattern: /^[a-zA-Z0-9_-]+$/,
        message: '只能包含字母、数字、下划线和横线'
      }
    ]
  },
  versionAlias: { label: fieldLabel('资源位子版本别名', false) },
  env: {
    label: fieldLabel(
      '泳道环境',
      true,
      '优先使用当前泳道下启用的配置，不存在则使用 online 环境启用的配置。'
    ), rules: [
      { required: true, message: '请输入泳道环境' },
      { pattern: /^\S+$/, message: '环境不能包含空格' }
    ]
  },
  exampleImage: { label: fieldLabel('资源位示例图', true), rules: [{ required: true, message: '请上传资源位示例图' }] },
  versionLimit: { label: fieldLabel('客户端版本限制', false) },
  showFrequencyControl: { label: fieldLabel('是否展示频控', false) },
  showReco: {
    label: fieldLabel(
      '是否支持开启算法开关',
      false,
      '打开时则 Vimo 资源位配置页面会展示「是否开启算法推荐」'
    )
  },
  abExperimentOptionEnabled: {
    label: fieldLabel(
      '是否支持切换实验类型',
      false,
      '打开时可选择切换服务端实验和客户端 SDK 实验'
    )
  },
  pageFrom: {
    label: fieldLabel(
      '埋点参数 pageFrom',
      false,
      '用于资源位配置跳转链接时，自动取该字段拼接到跳转链接的 ?page_form 参数中给端上上报埋点'
    )
  },
};

export const yesNo = [
  { label: '否', value: 0 },
  { label: '是', value: 1 }
];

export const frequencyOptions = [
  { label: '是', value: 1 },
  { label: '否', value: 0 }
];
