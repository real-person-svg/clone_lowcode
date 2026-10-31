import { isUndefined, omitBy } from 'lodash';

import type { ComponentInstance } from './types';
import { generateComponentId, getIsDeepComponent } from './utils';
import { canContainChildren } from './componentCapabilities';
import { parseConfig, validateConfig } from '@shared/config';

function transformComponent(component: ComponentInstance, parentPath?: string) {
  const { properties } = component;

  const path =
    properties.path && parentPath
      ? `${parentPath}.${properties.path}`
      : properties.path || '';
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
  const config: any = omitBy(
    {
      ...component.properties,
      // 旧配置消费者仍读取 key；编辑器只编辑 path，保存时保持两者一致。
      key: path,
      path,
      cProps,
    },
    isUndefined,
  );

  if (component.children && component.children.length > 0) {
    // 普通布局不增加字段层级；数组子项从每一行读取相对路径。
    config.children = component.children.map((child) =>
      transformComponent(
        child,
        getIsDeepComponent(component) ? '' : parentPath,
      ),
    );
  }

  return config;
}

export function transformEditorDataToConfig(components: ComponentInstance[]) {
  try {
    // 兼容根数组直接占用 config 的旧格式，避免生成 config.config。
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

function transformConfigItemToComponent(
  configItem: any,
  parentId?: string,
): ComponentInstance {
  const properties = {
    ...configItem,
    type: configItem.type,
    // 旧配置可能只有 key 或 path，导入时互相补齐，保留原始 type 别名。
    key: configItem.key || configItem.path,
    path: configItem.path || configItem.key,
    cProps: JSON.stringify(configItem.cProps),
  };

  if (properties.path?.startsWith('config.')) {
    properties.path = properties.path.substring(7);
  }
  if (properties.key?.startsWith('config.')) {
    properties.key = properties.key.substring(7);
  }

  // children 属于编辑器树，不进入属性表单或后续属性透传。
  delete properties.children;

  const component: ComponentInstance = {
    id: generateComponentId(),
    properties,
    parent: parentId,
  };

  // 先生成父节点 ID，再创建子节点，保证 parent 始终指向本次导入的父节点。
  if (canContainChildren(configItem.type)) {
    component.children = (configItem.children || []).map((child: any) =>
      transformConfigItemToComponent(child, component.id),
    );
  }

  return component;
}

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
