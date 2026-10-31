import type { ComponentInstance } from './types';

export const generateComponentId=()=>`component_${Date.now()}_${Math.random().toString(36).slice(2,11)}`;
export function findComponentById(components:ComponentInstance[],id:string):ComponentInstance|null {
  for(const node of components){if(node.id===id)return node;const child=node.children&&findComponentById(node.children,id);if(child)return child;}
  return null;
}
export const getIsDeepComponent=(component:ComponentInstance)=>component.properties.type?.replace(/^Form/,'')==='ArrayContainer';
export function getRequiredPropertyFields(component:ComponentInstance) {
  const type=component.properties.type?.replace(/^Form/,'');
  const fields=[{key:'path',label:'端上读取的字段名'},{key:'type',label:'组件类型'}];
  if(!['Card','Container','WrapContainer','ArrayContainer'].includes(type || ''))fields.push({key:'label',label:'标题'});
  return fields;
}
export function validateRequiredProperties(component:ComponentInstance){
  const errors=getRequiredPropertyFields(component).filter(({key})=>{const value=component.properties[key];return !value || typeof value==='string'&&!value.trim();}).map(({label})=>`${label} 不能为空`);
  return {valid:!errors.length,errors,componentName:component.properties.label || component.properties.type};
}
export function validateAllComponents(components:ComponentInstance[]){
  const invalidComponents:{component:ComponentInstance;errors:string[]}[]=[];
  const visit=(nodes:ComponentInstance[])=>nodes.forEach(component=>{const {errors}=validateRequiredProperties(component);if(errors.length)invalidComponents.push({component,errors});if(component.children)visit(component.children);});
  visit(components);return {valid:!invalidComponents.length,invalidComponents};
}
