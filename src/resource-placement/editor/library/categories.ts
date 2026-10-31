import type { ComponentType } from '../configuration/types';

export const defaultActiveCategories = ['layout', 'input', 'business', 'display'];

export function groupComponents(configs: Record<string, ComponentType>) {
  const categories: Record<
    string,
    { name: string; components: ComponentType[] }
  > = {
    layout: { name: '布局组件', components: [] as ComponentType[] },
    input: { name: '输入控件', components: [] as ComponentType[] },
  };

  Object.values(configs).forEach(
    /* 将组件加入其已定义的分类。 */
    (config) => {
      if (categories[config.category]) {
        categories[config.category].components.push(config);
      }
    });

  return categories;
}
