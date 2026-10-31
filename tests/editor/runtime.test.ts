// @vitest-environment jsdom
import { vi } from 'vitest';
import { compileConfigFunction, getInjectedProps, resolveFunction } from '../../src/features/resource-placement/editor/runtime/runtime';
import { createFormValuesStore, createVisibilitySnapshot } from '../../src/features/resource-placement/editor/runtime/formValuesStore';
vi.mock('@douyinfe/semi-ui',()=>({Toast:{error:vi.fn()},Form:()=>null,useFormState:()=>({values:{}})}));

test('function boundary runs formatting, validation and state linkage contracts',()=>{
  expect(compileConfigFunction('value => value ? [value] : []','输入')!('a')).toEqual(['a']);
  expect(compileConfigFunction('values => values[0]','输出')!(['b'])).toBe('b');
  expect(compileConfigFunction('value => value ? "" : "不能为空"','校验')!('')).toBe('不能为空');
  const setValue=vi.fn();resolveFunction('(value, formApi) => formApi.setValue("target",value)','联动',()=>undefined)!('x',{setValue});expect(setValue).toHaveBeenCalledWith('target','x');
  expect(resolveFunction('()=> {throw new Error("boom")}', '抛错',value=>value)!('fallback')).toBe('fallback');
  expect(()=>compileConfigFunction('123','非法')).toThrow();
});
test('async injection uses local region context and validates the result',async()=>{
  const result=await getInjectedProps(['regionList','({regionList}) => ({optionList:regionList})']);expect(Array.isArray(result.optionList)).toBe(true);
  expect(()=>getInjectedProps(['regionList','() => null'])).toThrow();expect(()=>getInjectedProps('bad')).toThrow();
  expect(await getInjectedProps(['regionList','async ({regionList}) => ({optionList:regionList.slice(0,1)})'])).toEqual({optionList:[{value:'CN',label:'中国'}]});
});
test('visibility subscribes to in-place nested mutations and preserves boolean false',()=>{
  const store=createFormValuesStore();const values={items:[{enabled:false}]};store.publish(values);
  const visible=createVisibilitySnapshot(store,'({config}) => config.items?.[0]?.enabled');expect(visible()).toBe(false);
  values.items[0].enabled=true;store.publish(values);expect(visible()).toBe(true);
  const required=createVisibilitySnapshot(store,'({config}) => config.items?.[0]?.enabled');expect(required()).toBe(true);
  values.items[0].enabled=false;store.publish(values);expect(required()).toBe(false);
  expect(createVisibilitySnapshot(store,false)()).toBe(false);expect(createVisibilitySnapshot(store,true)()).toBe(true);
  expect(createVisibilitySnapshot(store,'() => { throw new Error("visible"); }')()).toBe(true);
});
