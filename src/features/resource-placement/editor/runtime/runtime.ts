import { Toast } from '@douyinfe/semi-ui';
import { regionList } from '@/components/controls/localization';

type ConfigFunction = (...args: any[]) => any;
const reportedErrors = new Set<string>();
/** 在本地预览边界编译配置函数文本，并校验结果可调用。 */
export function compileConfigFunction(source: unknown, name: string): ConfigFunction | undefined {
  if (source === undefined || source === '') return undefined;
  if (typeof source === 'function') return source as ConfigFunction;
  if (typeof source !== 'string') throw new Error(`${name} 必须是函数字符串`);
  // 配置文本只在本地预览执行，API 和数据库层仅校验、存储文本，不在其中求值。
  const result: unknown = new Function(`"use strict"; return (${source});`)();
  if (typeof result !== 'function') throw new Error(`${name} 必须返回函数`);
  return result as ConfigFunction;
}
/** 按完整错误消息去重，再异步展示运行时错误。 */
export function reportRuntimeError(name: string, error: unknown) {
  const message = `${name}: ${error instanceof Error ? error.message : String(error)}`;
  // 以完整消息去重，避免同一规则在反复渲染或校验时持续弹出错误提示。
  if (reportedErrors.has(message)) return;
  reportedErrors.add(message);
  queueMicrotask(/* 延迟到微任务展示错误提示，避免在渲染过程中更新提示组件。 */ () => Toast.error({content:message,duration:5}));
}
/** 解析配置函数，并在编译或调用失败时报告错误、使用回退函数。 */
export function resolveFunction(source:unknown,name:string,fallback:ConfigFunction):ConfigFunction|undefined {
  if (!source) return undefined;
  let fn:ConfigFunction;
  try { fn=compileConfigFunction(source,name)!; }
  catch(error) {reportRuntimeError(name,error);return fallback;}
  return /* 调用配置函数，捕获运行异常后执行对应回退。 */ (...args:any[]) => {try{return fn(...args);}catch(error){reportRuntimeError(name,error);return fallback(...args);}};
}
/** 选择允许的上下文执行注入函数，并校验同步或异步返回的属性对象。 */
export function getInjectedProps(injection:unknown): Record<string,unknown> | Promise<Record<string,unknown>> {
  if(injection === undefined || injection === '') return {};
  let value=injection;
  if(typeof value === 'string') value=JSON.parse(value);
  if(!Array.isArray(value) || value.length!==2) throw new Error('异步注入应为 [上下文名称, 函数字符串]');
  const [keys,source] = value;
  const context:Record<string,unknown>={regionList};
  const selected=Object.fromEntries((Array.isArray(keys)?keys:[keys]).map(/* 从可用上下文中提取配置请求的命名项。 */ key => [key,context[key]]));
  const result=compileConfigFunction(source,'异步注入')!(selected);
  /** 确保注入结果是可展开的属性对象。 */
  const check=(props:unknown) => {
    if(!props || typeof props!=='object' || Array.isArray(props)) throw new Error('异步注入必须返回属性对象');
    return props as Record<string,unknown>;
  };
  return result instanceof Promise?result.then(check):check(result);
}

/** 将布尔值、空值文本或函数文本统一转换为可见性判断函数。 */
export function compileVisibilityFunction(source:string|boolean):ConfigFunction {
  if(typeof source==='boolean')return/* 对布尔配置直接返回其固定可见性。 */ ()=>source;
  if(['null','undefined'].includes(source.trim()))return/* 将 null 或 undefined 文本视为不可见。 */ ()=>false;
  return compileConfigFunction(source,'是否展示')!;
}
