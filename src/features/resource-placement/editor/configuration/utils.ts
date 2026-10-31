import type { ComponentInstance } from './types';
import { canContainChildren } from './componentCapabilities';

/** 为编辑器组件生成包含时间和随机片段的实例 ID。 */
export const generateComponentId = () =>
  `component_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

/** 在组件树中递归查找指定 ID 的节点。 */
export function findComponentById(
  components: ComponentInstance[],
  id: string,
): ComponentInstance | null {
  for (const node of components) {
    if (node.id === id) return node;
    const child = node.children && findComponentById(node.children, id);
    if (child) return child;
  }
  return null;
}

/** 判断组件是否为需要相对字段路径的数组容器。 */
export const getIsDeepComponent = (component: ComponentInstance) =>
  component.properties.type?.replace(/^Form/, '') === 'ArrayContainer';

/** 根据容器能力确定属性面板和保存校验共用的必填字段。 */
export function getRequiredPropertyFields(component: ComponentInstance) {
  const fields = [
    { key: 'path', label: '端上读取的字段名' },
    { key: 'type', label: '组件类型' },
  ];
  if (!canContainChildren(component.properties.type)) {
    fields.push({ key: 'label', label: '标题' });
  }
  return fields;
}

/** 检查单个组件的必填属性并返回可读错误列表。 */
export function validateRequiredProperties(component: ComponentInstance) {
  const errors = getRequiredPropertyFields(component)
    .filter(/* 筛出未填或只含空白的必填属性。 */ ({ key }) => {
      const value = component.properties[key];
      return !value || (typeof value === 'string' && !value.trim());
    })
    .map(/* 将缺失属性转换为对应字段的错误提示。 */ ({ label }) => `${label} 不能为空`);
  return {
    valid: !errors.length,
    errors,
    componentName: component.properties.label || component.properties.type,
  };
}

/** 按画布先序遍历校验全部节点，收集可定位的无效组件。 */
export function validateAllComponents(components: ComponentInstance[]) {
  const invalidComponents: {
    component: ComponentInstance;
    errors: string[];
  }[] = [];
  // 保存会选中首个无效组件，因此校验顺序必须与画布的先序遍历一致。
  /** 依次校验每个节点，并在处理下一兄弟节点前递归其子树。 */
  const visit = (nodes: ComponentInstance[]) => {
    nodes.forEach(/* 收集当前组件错误，并继续遍历其子节点。 */ (component) => {
      const { errors } = validateRequiredProperties(component);
      if (errors.length) invalidComponents.push({ component, errors });
      if (component.children) visit(component.children);
    });
  };
  visit(components);
  return { valid: !invalidComponents.length, invalidComponents };
}
