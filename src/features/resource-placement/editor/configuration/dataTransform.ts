import { isUndefined, omitBy, toString } from 'lodash';

import { ComponentInstance } from './types';
import { getIsDeepComponent } from './utils';
import { canContainChildren } from './componentCapabilities';
import { parseConfig, validateConfig } from '@shared/config';
/**
 * 保存时，将组件的数据结构转换为 TCC 的配置格式
 * @param component - 组件实例
 * @param parentPath - 父级路径
 * @returns 转换后的配置对象
 */
function transformComponent(component: ComponentInstance, parentPath?: string) {
  const { properties } = component;

  // 生成 path
  const path =
    properties.path && parentPath
      ? `${parentPath}.${properties.path}`
      : properties.path || '';
  // const key = parentPath ? `${parentPath}.${properties.key}` : properties.key;

  // 解析 cProps
  // eslint-disable-next-line no-eval
  let cProps;
  try {
    cProps = properties.cProps ? JSON.parse(properties.cProps) : undefined;
  } catch (e) {
    throw new Error(
      `组件 ${properties.label || properties.path || ''} 的 cProps 不是有效 JSON`,
    );
  }
  if (
    cProps !== undefined &&
    (!cProps || typeof cProps !== 'object' || Array.isArray(cProps))
  ) {
    throw new Error('cProps 必须是 JSON 对象');
  }
  // 构建基础配置对象
  const config: any = omitBy(
    {
      ...component.properties,
      key: path, // 兼容 TCC 的数据得保留 key，key 通常跟 path 一致，不暴露输入给用户，在这里直接取 path 的值
      path,
      cProps,
    },
    isUndefined,
  );

  // 递归处理子组件
  if (component.children && component.children.length > 0) {
    config.children = component.children.map((child) =>
      transformComponent(
        child,
        getIsDeepComponent(component) ? '' : parentPath,
      ),
    );
  }

  return config;
}

/**
 * 将编辑器数据转换为 tcc 数据结构
 * @param components - 编辑器组件数组
 * @returns 转换后的配置数据
 */
export function transformEditorDataToConfig(components: ComponentInstance[]) {
  try {
    // 如果整个资源位配置都只有一个 array，则无需添加 config 前缀
    const isSingleArrayConfig =
      components.length === 1 &&
      getIsDeepComponent(components[0]) &&
      components[0].properties?.path === 'config';
    const content = components.map((component) =>
      transformComponent(component, isSingleArrayConfig ? '' : 'config'),
    );
    const result = { content };
    validateConfig(result);
    return result;
  } catch (error) {
    throw new Error(
      `数据转换失败: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * 生成唯一的组件ID
 * @returns 唯一ID字符串
 */
function generateUniqueId(): string {
  return `component_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 转换单个配置项为组件实例
 * @param configItem - 配置项
 * @param parentId - 父组件ID
 * @returns 组件实例
 */
function transformConfigItemToComponent(
  configItem: any,
  parentId?: string,
): ComponentInstance {
  // 构建组件属性，需要处理path字段去掉config前缀
  const properties = {
    ...configItem,
    type: configItem.type, // 保持原始type用于保存
    key: configItem.key || configItem.path, // 如果缺少 key 或 path，则取另一个的值，tcc 的不少配置不是少这少那的
    path: configItem.path || configItem.key,
    cProps: JSON.stringify(configItem.cProps), // 保持字符串格式
  };

  // 处理path字段，去掉config.前缀
  if (properties.path?.startsWith('config.')) {
    properties.path = properties.path.substring(7);
  }
  if (properties.key?.startsWith('config.')) {
    properties.key = properties.key.substring(7);
  }

  // 移除不需要的字段
  delete properties.children;

  const component: ComponentInstance = {
    id: generateUniqueId(),
    properties,
    parent: parentId,
  };

  // 处理子组件
  if (canContainChildren(configItem.type)) {
    component.children = (configItem.children || []).map((child: any) =>
      transformConfigItemToComponent(child, component.id),
    );
  }

  return component;
}

/**
 * 初始化时，将 TCC 的配置数据转换为编辑器数据格式
 * @param configData - 配置数据字符串
 * @returns 编辑器组件数组
 */
export function transformConfigToEditorData(
  configData: string,
): ComponentInstance[] {
  try {
    if (!configData || typeof configData !== 'string') {
      return [];
    }

    const parsedConfig = parseConfig(configData);

    const components = parsedConfig.content.map((item: any) =>
      transformConfigItemToComponent(item),
    );

    return components;
  } catch (error) {
    throw new Error(
      `配置数据解析失败: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
