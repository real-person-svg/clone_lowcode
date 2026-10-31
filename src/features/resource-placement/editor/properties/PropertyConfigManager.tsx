/**
 * 统一属性配置管理器
 * 根据飞书文档要求实现统一的属性配置系统
 */

import { getRequiredPropertyFields } from '../configuration/utils';
import {
  canContainChildren,
  getTypeChangeError,
} from '../configuration/componentCapabilities';
import { Form } from '@douyinfe/semi-ui';

import { ComponentInstance, PropertyConfig } from '../configuration/types';
import { FormCodeEditor } from '../code/CodeEditor';
import {
  COMPONENT_CONFIGS,
  componentOptions,
  getComponentDefaultConfig,
} from '../library/componentConfigs';

/**
 * 属性配置管理器
 */
export class PropertyConfigManager {
  /**
   * 获取基础必填属性
   */
  static getBaseProperties(
    selectedComponent: ComponentInstance,
  ): PropertyConfig[] {
    const currentComponentType = selectedComponent?.properties?.type;
    const required = new Set(
      getRequiredPropertyFields(selectedComponent).map((field) => field.key),
    );
    return [
      {
        key: 'path',
        path: 'path',
        label: '端上读取的字段名',
        component: Form.Input,
        require: required.has('path'),
        tips: '端上从接口读取配置内容的字段 path',
      },
      currentComponentType !== 'Card'
        ? {
            key: 'label',
            path: 'label',
            label: '标题',
            component: Form.Input,
            require: required.has('label'),
            tips: '在资源位后台显示的配置标题',
          }
        : null,
      {
        key: 'type',
        path: 'type',
        label: '组件类型',
        require: true,
        component: Form.Select,
        tips: selectedComponent.children?.length
          ? '当前组件包含子组件，请先移出或删除子组件后再切换为非容器类型'
          : undefined,
        props: {
          optionList: componentOptions.map((option) => ({
            ...option,
            disabled:
              Boolean(selectedComponent.children?.length) &&
              !canContainChildren(option.value),
          })),
          onChange: (newType: string, form: any) => {
            if (getTypeChangeError(selectedComponent, newType)) return;
            form.current.setValue(
              'cProps',
              getComponentDefaultConfig(newType, 'cProps'),
            );
            form.current.setValue(
              'validate',
              getComponentDefaultConfig(newType, 'validate'),
            );
            form.current.setValue(
              'asyncInject',
              getComponentDefaultConfig(newType, 'asyncInject'),
            );
            form.current.setValue(
              'inputFormat',
              getComponentDefaultConfig(newType, 'inputFormat'),
            );
            form.current.setValue(
              'outputFormat',
              getComponentDefaultConfig(newType, 'outputFormat'),
            );
            form.current.setValue(
              'onChangeState',
              getComponentDefaultConfig(newType, 'onChangeState'),
            );
          },
        },
      },
      {
        key: 'tips',
        path: 'tips',
        label: '提示内容',
        component: Form.Input,
        tips: '资源位后台对应配置的提示信息',
      },
      {
        key: 'require',
        path: 'require',
        label: '是否必填',
        component: Form.Select,
        placeholder: '默认是非必填',
        props: {
          optionList: [
            {
              value: true as any,
              label: '是',
            },
            {
              value: false as any,
              label: '否',
            },
          ],
        },
      },
      {
        key: 'isShow',
        path: 'isShow',
        label: '是否展示',
        component: Form.Input,
        tips: '用于动态条件渲染配置项，可填一个函数 (state) => boolean， state.config 是资源位配置表单的值，只有返回 true 时才展示该配置项',
      },
      {
        key: 'cProps',
        path: 'cProps',
        label: '直接透传给组件的属性',
        component: FormCodeEditor,
        tips: '可配置 semi-ui 支持的组件原生props，以 JSON 格式输入',
      },
    ].filter((item): item is NonNullable<typeof item> =>
      Boolean(item),
    ) as PropertyConfig[];
  }

  /**
   * 获取可选高级属性
   */
  static getAdvancedProperties(): PropertyConfig[] {
    return [
      {
        key: 'validate',
        path: 'validate',
        label: '校验函数',
        component: Form.Input,
        tips: `用于校验配置项的输入合不合法，可填一个函数例如  val => val?.value ? '' : '按钮文案不能为空'。val是当前配置项的输入数据，返回空串时检验通过，返回其他 string 时会当做校验不通过的 error message`,
      },
      {
        key: 'asyncInject',
        path: 'asyncInject',
        label: '异步注入',
        component: Form.Input,
        tips: '无需手动填写，用于解决一些组件的 options/treeData 是异步获取的，填一个数组，格式例如 [string | string[], (v: any) => { [k: string]: any }]',
      },
      {
        key: 'inputFormat',
        path: 'inputFormat',
        label: '输入格式化函数',
        component: Form.Input,
        tips: '在配置项输入时做格式化转换，填一个函数例如 val => (val ? [val] : [])。val 是当前配置项的配置数据',
      },
      {
        key: 'outputFormat',
        path: 'outputFormat',
        label: '输出格式化函数',
        component: Form.Input,
        tips: '在配置项输出时做格式化转换，填一个函数 val => val[0]。val 是当前配置项的配置数据',
      },
      {
        key: 'onChangeState',
        path: 'onChangeState',
        label: '配置变更的回调函数',
        component: Form.Input,
        tips: `在配置项触发 onChange 时，对另一个配置项进行修改，可填一个函数例如 (value, formApi) => formApi.setValue('config.confirm_btn.background_image', undefined)`,
      },
    ];
  }
}
