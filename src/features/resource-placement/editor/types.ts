// 每个资源位属性配置的结构
export interface PropertyConfig {
  [key: string]: any;
  // 资源位支持的所有属性配置
  key?: string;
  path?: string;
  label?: string;
  type?: string;
  tips?: string;
  require?: boolean | string;
  isShow?: string | boolean; // 支持函数字符串
  validate?: string; // 函数字符串
  asyncInject?: [string | string[], string] | string; // 异步注入配置
  inputFormat?: string; // 函数字符串
  outputFormat?: string; // 函数字符串
  onChangeState?: string; // 函数字符串
  cProps?: string;

  // 属性可指定的 props
  component?: any; // 资源位属性，交互所用的组件
  disabled?: boolean; // 是否禁止编辑
  placeholder?: string;
  props?: {
    optionList?: {
      value: string;
      label: string;
      disabled?: boolean;
    }[];
    onChange?: (newVal: any, form: any) => void;
  };
}

// 组件库中，每个组件的结构
export interface ComponentType {
  type: string;
  name: string;
  icon: string;
  category: 'layout' | 'input' | 'business' | 'display';
  // defaultProps: Partial<UnifiedPropertyConfig>;
  defaultProps: PropertyConfig;
  allowChildren?: boolean;
}

// 画布中，每个组件的数据结构
export interface ComponentInstance {
  id: string;
  properties: PropertyConfig;
  children?: ComponentInstance[];
  parent?: string;
}

// 资源位信息接口
export interface ResourcePlacementInfo {
  id?: number;
  resourceKey: string;
  resourceName: string;
  bizId: number;
  env: string;
  description?: string;
  revision?: number;
  configData?: string; // 低码化配置数据（JSON字符串）
  from?: string;
  status?: number;
}

export interface LowCodeEditorState {
  components: ComponentInstance[];
  resourceInfo?: ResourcePlacementInfo;
}

export interface DragItem {
  type: 'component' | 'existing-component';
  componentType?: string; // 新组件类型
  name?: string; // 新组件名称
  id?: string; // 现有组件ID
  index?: number; // 组件索引
}

export type AddComponentHandler = (componentType: string, parentId?: string, index?: number) => void;
