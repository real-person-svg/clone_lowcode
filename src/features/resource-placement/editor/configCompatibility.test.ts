import { transformConfigToEditorData, transformEditorDataToConfig } from './dataTransform';
import { insertTreeNode, moveTreeNode, patchTreeNode, updateTreeNode } from './componentTree';
import TypeScriptParser from './TypeScriptParser';
import type { ComponentInstance } from './types';

const leaf=(id:string,parent?:string):ComponentInstance=>({id,parent,properties:{type:'FormInput',path:id,label:id}});
const container=(id:string,children:ComponentInstance[]):ComponentInstance=>({id,properties:{type:'Container',path:id},children});

test('legacy root array and expressions preserve their exact saved contract',()=>{
  const saved={content:[{type:'ArrayContainer',key:'config',path:'config',label:'rows',isShow:'({config}) => Object.values(config).some(v => v?.[0]?.enabled)',cProps:{initValue:[{enabled:true}]},children:[{type:'Input',key:'name',path:'name',label:'name',isShow:'state => state.config["config"]?.[0]?.enabled',cProps:{keepState:true},onChangeState:'(value, formApi) => formApi.setValue("other", value)',extension:{version:1}}]}]};
  expect(transformEditorDataToConfig(transformConfigToEditorData(JSON.stringify(saved)))).toEqual(saved);
});
test('top-level prefixes, nested layouts and array-relative paths match fixed expected data',()=>{
  const nodes=[container('layout',[leaf('title')]),{id:'array',properties:{type:'ArrayContainer',path:'items',label:'rows'},children:[leaf('name','array')]}];
  expect(transformEditorDataToConfig(nodes)).toEqual({content:[{type:'Container',path:'config.layout',key:'config.layout',children:[{type:'FormInput',path:'config.title',key:'config.title',label:'title'}]},{type:'ArrayContainer',path:'config.items',key:'config.items',label:'rows',children:[{type:'FormInput',path:'name',key:'name',label:'name'}]}]});
});
test('missing key or path falls back, while boolean visibility and extensions remain intact',()=>{
  const nodes=transformConfigToEditorData(JSON.stringify({content:[{type:'Input',key:'config.title',label:'标题',isShow:false,extension:{a:1}},{type:'FormInput',path:'config.caption',label:'文案'}]}));
  expect(nodes[0].properties.path).toBe('title');
  expect(transformEditorDataToConfig(nodes)).toEqual({content:[{type:'Input',key:'config.title',path:'config.title',label:'标题',isShow:false,extension:{a:1}},{type:'FormInput',key:'config.caption',path:'config.caption',label:'文案'}]});
});
test('malformed JSON, structure, unsupported types, invalid props and unsafe paths are rejected',()=>{
  for(const bad of ['{','{}','{"content":[null]}','{"content":[{"type":"Bogus"}]}','{"content":[{"type":"Input","cProps":[]}]}','{"content":[{"type":"Input","path":"config.__proto__.x"}]}'])expect(()=>transformConfigToEditorData(bad)).toThrow();
  expect(()=>transformEditorDataToConfig([{id:'bad',properties:{type:'FormInput',path:'bad',label:'bad',cProps:'{'}}])).toThrow('cProps');
});
test('tree operations preserve unrelated subtrees and maintain destination parents',()=>{
  const a=container('a',[leaf('a1','a'),leaf('a2','a')]);const b=container('b',[leaf('b1','b')]);const c=leaf('c');const nodes=[a,b,c];
  const patched=patchTreeNode(nodes,'a1',{properties:{...a.children![0].properties,label:'changed'}});
  expect(patched[1]).toBe(b);expect(patched[0].children![1]).toBe(a.children![1]);
  const inserted=insertTreeNode(nodes,leaf('new'),'a',1);expect(inserted[0].children!.map(node=>node.id)).toEqual(['a1','new','a2']);
  const moved=moveTreeNode(nodes,'a1','b1','before');expect(moved[1].children!.map(node=>node.id)).toEqual(['a1','b1']);expect(moved[1].children![0].parent).toBe('b');
  const root=moveTreeNode(moved,'a1','c','after');expect(root.map(node=>node.id)).toEqual(['a','b','c','a1']);expect(root[3].parent).toBeUndefined();
  expect(updateTreeNode(nodes,'a1',()=>null)[0].children!.map(node=>node.id)).toEqual(['a2']);
  expect(moveTreeNode(nodes,'a','a1','inside')).toBe(nodes);expect(moveTreeNode(nodes,'a','a','after')).toBe(nodes);expect(moveTreeNode(nodes,'a1','c','inside')).toBe(nodes);expect(moveTreeNode(nodes,'c','missing','before')).toBe(nodes);
});
test('local TS parser infers common fields, enum options and nested arrays',()=>{
  const parser=new TypeScriptParser();const nodes=parser.generateEditorConfig(parser.parseInterface('interface Demo { title: string; enabled: boolean; count: number; kind: "a" | "b"; items: { name: string; }[]; }'));
  expect(nodes.map(node=>node.properties.type)).toEqual(['FormInput','FormInput','FormInputNumber','FormSelect','ArrayContainer']);
  expect(JSON.parse(nodes[3].properties.cProps!).optionList).toEqual([{label:'a',value:'a'},{label:'b',value:'b'}]);
  expect(nodes[4].children![0].properties.path).toBe('name');expect(nodes[4].children![0].parent).toBe(nodes[4].id);
  expect(()=>parser.parseInterface('')).toThrow();expect(()=>parser.parseInterface('interface X { foo string }')).toThrow();
});
