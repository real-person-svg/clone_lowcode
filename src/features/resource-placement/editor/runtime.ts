import { Toast } from '@douyinfe/semi-ui';
import { regionList } from '@/components/controls/localization';

type ConfigFunction = (...args: any[]) => any;
const reportedErrors = new Set<string>();
/** All imported function text is evaluated only in this local preview boundary. */
export function compileConfigFunction(source: unknown, name: string): ConfigFunction | undefined {
  if (source === undefined || source === '') return undefined;
  if (typeof source === 'function') return source as ConfigFunction;
  if (typeof source !== 'string') throw new Error(`${name} 必须是函数字符串`);
  // Configuration is authored locally. Keep evaluation out of API/database code.
  const result: unknown = new Function(`"use strict"; return (${source});`)();
  if (typeof result !== 'function') throw new Error(`${name} 必须返回函数`);
  return result as ConfigFunction;
}
export function reportRuntimeError(name: string, error: unknown) {
  const message = `${name}: ${error instanceof Error ? error.message : String(error)}`;
  if (reportedErrors.has(message)) return;
  reportedErrors.add(message);
  queueMicrotask(() => Toast.error({content:message,duration:5}));
}
export function resolveFunction(source:unknown,name:string,fallback:ConfigFunction):ConfigFunction|undefined {
  if (!source) return undefined;
  let fn:ConfigFunction;
  try { fn=compileConfigFunction(source,name)!; }
  catch(error) {reportRuntimeError(name,error);return fallback;}
  return (...args:any[]) => {try{return fn(...args);}catch(error){reportRuntimeError(name,error);return fallback(...args);}};
}
export function getInjectedProps(injection:unknown): Record<string,unknown> | Promise<Record<string,unknown>> {
  if(injection === undefined || injection === '') return {};
  let value=injection;
  if(typeof value === 'string') value=JSON.parse(value);
  if(!Array.isArray(value) || value.length!==2) throw new Error('异步注入应为 [上下文名称, 函数字符串]');
  const [keys,source] = value;
  const context:Record<string,unknown>={regionList};
  const selected=Object.fromEntries((Array.isArray(keys)?keys:[keys]).map(key => [key,context[key]]));
  const result=compileConfigFunction(source,'异步注入')!(selected);
  const check=(props:unknown) => {
    if(!props || typeof props!=='object' || Array.isArray(props)) throw new Error('异步注入必须返回属性对象');
    return props as Record<string,unknown>;
  };
  return result instanceof Promise?result.then(check):check(result);
}

export function compileVisibilityFunction(source:string|boolean):ConfigFunction {
  if(typeof source==='boolean')return()=>source;
  if(['null','undefined'].includes(source.trim()))return()=>false;
  return compileConfigFunction(source,'是否展示')!;
}
