import { cloneDeep } from 'lodash';

import { ComponentInstance, PropertyConfig } from './types';
import { generateComponentId } from './utils';
import { COMPONENT_CONFIGS } from './componentConfigs';

export interface ParsedField {
  key: string;
  path: string;
  type: string;
  isArray: boolean;
  isObject: boolean;
  enumValues?: string[];
  children?: ParsedField[];
}

export class TypeScriptParser {
  /**
   * 解析 TypeScript interface 定义
   */
  parseInterface(tsDefinition: string): ParsedField[] {
    try {
      // 移除注释和多余的空格
      const cleanedDefinition = this.cleanTsDefinition(tsDefinition);

      let parsed: Record<string, any>;

      try {
        // 优先尝试解析 JSON 格式定义
        parsed = JSON.parse(cleanedDefinition);
      } catch (jsonError) {
        // 如果不是 JSON，则尝试解析 interface 定义
        parsed = this.parseTsInterfaceDefinition(cleanedDefinition);
      }

      return this.parseObject(parsed);
    } catch (error) {
      throw new Error(`解析 TypeScript 定义失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 清理 TS 定义字符串
   */
  private cleanTsDefinition(definition: string): string {
    return definition
      .replace(/\/\*[\s\S]*?\*\//g, '') // 移除块注释
      .replace(/\/\/.*$/gm, '') // 移除行注释
      .trim();
  }

  /**
   * 将 interface 类型定义转换为 JS 对象
   */
  private parseTsInterfaceDefinition(definition: string): Record<string, any> {
    const trimmed = definition.trim();

    if (!trimmed) {
      throw new Error('空的 TypeScript 定义');
    }

    const interfaceMatch = trimmed.match(/^(export\s+)?interface\s+\w+\s*/);
    const typeMatch = trimmed.match(/^(export\s+)?type\s+\w+\s*=\s*/);

    let literal = trimmed;

    if (interfaceMatch) {
      literal = trimmed.slice(interfaceMatch[0].length);
    } else if (typeMatch) {
      literal = trimmed.slice(typeMatch[0].length);
    }

    const { value } = this.parseObjectTypeLiteral(literal, 0);
    return value;
  }

  /**
   * 解析对象类型字面量
   */
  private parseObjectTypeLiteral(
    source: string,
    startIndex: number
  ): {
    value: Record<string, any>;
    endIndex: number;
  } {
    const { length } = source;
    let index = startIndex;

    while (index < length && source[index] !== '{') {
      index++;
    }

    if (index >= length || source[index] !== '{') {
      throw new Error('未找到 { 符号');
    }

    index += 1;
    const result: Record<string, any> = {};

    while (index < length) {
      index = this.skipWhitespace(source, index);

      if (index >= length) {
        break;
      }

      if (source[index] === '}') {
        return { value: result, endIndex: index + 1 };
      }

      const { name, nextIndex } = this.parsePropertyName(source, index);
      index = nextIndex;

      index = this.skipWhitespace(source, index);

      if (source[index] !== ':') {
        throw new Error(`属性 ${name} 缺少冒号`);
      }

      index += 1;

      const { typeStr, nextPosition } = this.readTypeExpression(source, index);
      const value = this.transformTypeExpression(typeStr.trim());
      result[name] = value;
      index = nextPosition;

      index = this.skipWhitespace(source, index);

      if (source[index] === ';' || source[index] === ',') {
        index += 1;
      }
    }

    throw new Error('对象类型未正确闭合');
  }

  /**
   * 跳过空白字符
   */
  private skipWhitespace(source: string, index: number): number {
    let nextIndex = index;

    while (nextIndex < source.length && /\s/.test(source[nextIndex])) {
      nextIndex += 1;
    }

    return nextIndex;
  }

  /**
   * 解析属性名
   */
  private parsePropertyName(
    source: string,
    startIndex: number
  ): {
    name: string;
    nextIndex: number;
  } {
    let index = this.skipWhitespace(source, startIndex);

    const readonlyMatch = source.slice(index).match(/^readonly\s+/);
    if (readonlyMatch) {
      index += readonlyMatch[0].length;
    }

    if (index >= source.length) {
      throw new Error('意外结束，缺少属性名');
    }

    let name = '';
    const firstChar = source[index];

    if (firstChar === "'" || firstChar === '"') {
      const quote = firstChar;
      index += 1;
      const nameStart = index;

      while (index < source.length && source[index] !== quote) {
        if (source[index] === '\\') {
          index += 2;
          continue;
        }

        index += 1;
      }

      if (index >= source.length) {
        throw new Error('属性名缺少结束引号');
      }

      name = source.slice(nameStart, index);
      index += 1;
    } else {
      const nameMatch = source.slice(index).match(/^[A-Za-z0-9_$]+/);

      if (!nameMatch) {
        throw new Error('无法解析属性名');
      }

      const [matchedName] = nameMatch;
      name = matchedName;
      index += matchedName.length;
    }

    index = this.skipWhitespace(source, index);

    if (source[index] === '?') {
      index += 1;
      index = this.skipWhitespace(source, index);
    }

    return { name, nextIndex: index };
  }

  /**
   * 读取类型表达式
   */
  private readTypeExpression(
    source: string,
    startIndex: number
  ): {
    typeStr: string;
    nextPosition: number;
  } {
    const index = this.skipWhitespace(source, startIndex);
    let i = index;

    let depthBrace = 0;
    let depthBracket = 0;
    let depthParen = 0;
    let depthAngle = 0;

    let inSingleQuote = false;
    let inDoubleQuote = false;
    let inTemplate = false;

    while (i < source.length) {
      const char = source[i];
      const prevChar = i > 0 ? source[i - 1] : '';

      if (inSingleQuote) {
        if (char === "'" && prevChar !== '\\') {
          inSingleQuote = false;
        }
        i += 1;
        continue;
      }

      if (inDoubleQuote) {
        if (char === '"' && prevChar !== '\\') {
          inDoubleQuote = false;
        }
        i += 1;
        continue;
      }

      if (inTemplate) {
        if (char === '`' && prevChar !== '\\') {
          inTemplate = false;
        }
        i += 1;
        continue;
      }

      if (char === "'") {
        inSingleQuote = true;
        i += 1;
        continue;
      }

      if (char === '"') {
        inDoubleQuote = true;
        i += 1;
        continue;
      }

      if (char === '`') {
        inTemplate = true;
        i += 1;
        continue;
      }

      if (char === '{') {
        depthBrace += 1;
        i += 1;
        continue;
      }

      if (char === '}') {
        if (depthBrace === 0) {
          break;
        }

        depthBrace -= 1;
        i += 1;
        continue;
      }

      if (char === '[') {
        depthBracket += 1;
        i += 1;
        continue;
      }

      if (char === ']') {
        if (depthBracket > 0) {
          depthBracket -= 1;
        }
        i += 1;
        continue;
      }

      if (char === '(') {
        depthParen += 1;
        i += 1;
        continue;
      }

      if (char === ')') {
        if (depthParen > 0) {
          depthParen -= 1;
        }
        i += 1;
        continue;
      }

      if (char === '<') {
        depthAngle += 1;
        i += 1;
        continue;
      }

      if (char === '>') {
        if (depthAngle > 0) {
          depthAngle -= 1;
          i += 1;
          continue;
        }

        break;
      }

      if (
        (char === ';' || char === ',' || char === '\n' || char === '\r') &&
        depthBrace === 0 &&
        depthBracket === 0 &&
        depthParen === 0 &&
        depthAngle === 0
      ) {
        break;
      }

      i += 1;
    }

    const typeStr = source.slice(index, i).trim();
    return { typeStr, nextPosition: i };
  }

  /**
   * 将类型表达式转换为可解析的值
   */
  private transformTypeExpression(typeExpression: string): any {
    const expression = typeExpression.trim();

    if (!expression) {
      return 'any';
    }

    const arraySuffixMatch = expression.match(/(\[\])+$/);

    if (arraySuffixMatch) {
      const depth = arraySuffixMatch[0].length / 2;
      const innerExpression = expression.slice(0, -arraySuffixMatch[0].length).trim();
      let innerValue = this.transformTypeExpression(innerExpression || 'any');

      for (let i = 0; i < depth; i += 1) {
        innerValue = [innerValue];
      }

      return innerValue;
    }

    if (expression.startsWith('{')) {
      return this.parseObjectTypeLiteral(expression, 0).value;
    }

    const arrayPrefixes = ['Array', 'ReadonlyArray'];

    for (const prefix of arrayPrefixes) {
      const prefixWithGeneric = `${prefix}<`;

      if (expression.startsWith(prefixWithGeneric)) {
        const inner = this.extractGenericContent(expression);
        const innerValue = this.transformTypeExpression(inner.trim());
        return [innerValue];
      }
    }

    let baseValue: any;
    const literalMatch = expression.match(/^([\'\"`]).*\1$/);

    if (literalMatch) {
      baseValue = expression;
    } else {
      const lower = expression.toLowerCase();

      switch (lower) {
        case 'string':
        case 'number':
        case 'boolean':
        case 'any':
        case 'unknown':
        case 'null':
        case 'undefined':
          baseValue = lower;
          break;
        default:
          if (expression.includes('|')) {
            baseValue = expression;
          } else if (expression.startsWith('{')) {
            baseValue = this.parseObjectTypeLiteral(expression, 0).value;
          } else {
            baseValue = expression;
          }
      }
    }

    return baseValue;
  }

  /**
   * 提取泛型内容
   */
  private extractGenericContent(expression: string): string {
    const start = expression.indexOf('<');

    if (start === -1) {
      throw new Error('泛型缺少 <');
    }

    let depth = 0;

    for (let i = start + 1; i < expression.length; i += 1) {
      const char = expression[i];

      if (char === '<') {
        depth += 1;
      } else if (char === '>') {
        if (depth === 0) {
          return expression.slice(start + 1, i);
        }

        depth -= 1;
      }
    }

    throw new Error('泛型缺少 >');
  }

  /**
   * 递归解析对象结构
   */
  private parseObject(obj: any, parentKey = ''): ParsedField[] {
    const fields: ParsedField[] = [];

    for (const [key, value] of Object.entries(obj)) {
      const fieldPath = parentKey ? `${parentKey}.${key}` : key;
      const field = this.parseField(key, value, fieldPath);
      fields.push(field);
    }

    return fields;
  }

  /**
   * 解析单个字段
   */
  private parseField(key: string, value: any, path: string): ParsedField {
    if (Array.isArray(value)) {
      // 处理数组类型
      const arrayItemType = value.length > 0 ? value[0] : 'string';
      const isItemObject =
        typeof arrayItemType === 'object' && arrayItemType !== null && !Array.isArray(arrayItemType);

      const children = isItemObject ? this.parseObject(arrayItemType) : undefined;

      return {
        key,
        path,
        type: 'array',
        isArray: true,
        isObject: isItemObject,
        children
      };
    } else if (typeof value === 'object' && value !== null) {
      // 处理对象类型
      return {
        key,
        path,
        type: 'object',
        isArray: false,
        isObject: true,
        children: this.parseObject(value, path)
      };
    } else if (typeof value === 'string' && value.includes('|')) {
      // 处理枚举类型 (用 | 分割的联合类型)
      const enumValues = value
        .split('|')
        .map((v) => v.trim().replace(/['"]/g, ''))
        .filter((v) => v.length > 0);

      return {
        key,
        path,
        type: 'enum',
        isArray: false,
        isObject: false,
        enumValues
      };
    } else {
      // 处理基本类型
      return {
        key,
        path,
        type: typeof value === 'string' ? value : typeof value,
        isArray: false,
        isObject: false
      };
    }
  }

  /**
   * 根据字段信息推导组件类型
   */
  inferComponentType(field: ParsedField): string {
    const { key, type, enumValues } = field;
    const lowerKey = key.toLowerCase();

    if (field.isArray) {
      return 'ArrayContainer';
    }

    // 根据字段名推导
    if (lowerKey.includes('color')) {
      return 'FormColorPicker';
    }

    if (lowerKey.includes('url') || lowerKey.includes('img')) {
      return 'FormUpload';
    }

    // 根据类型推导
    if (type === 'number') {
      return 'FormInputNumber';
    }

    if (type === 'enum' && enumValues && enumValues.length > 0) {
      return 'FormSelect';
    }

    if (type === 'object') {
      return 'Card';
    }

    // 默认使用 Input
    return 'FormInput';
  }

  /**
   * 生成组件的默认属性
   */
  private generateComponentProps(field: ParsedField, componentType: string) {
    // 直接去掉前缀的 Form 就能得到 actualComponentType
    const actualComponentType = componentType.replace('Form', '');

    // 获取组件配置中的默认属性
    const componentConfig = COMPONENT_CONFIGS[actualComponentType];
    const defaultProps: PropertyConfig = componentConfig?.defaultProps || {};

    const props = {
      ...defaultProps,
      label: field.key,
      key: field.key,
      path: field.path
    };

    // 特殊处理 Select 组件，用推导出来的 optionList 覆盖默认值
    if (componentType === 'FormSelect' && field.enumValues) {
      const defaultCProps = defaultProps.cProps ? JSON.parse(defaultProps.cProps) : {};
      props.cProps = JSON.stringify({
        ...defaultCProps,
        optionList: field.enumValues.map((value) => ({ label: value, value }))
      });
    }

    return props;
  }

  /**
   * 将解析的字段转换为 editorConfig
   */
  generateEditorConfig(fields: ParsedField[]): ComponentInstance[] {
    return fields.map((field) => this.fieldToComponent(field));
  }
  /**
   * 将单个字段转换为组件实例
   */
  private fieldToComponent(field: ParsedField): ComponentInstance {
    const componentType = this.inferComponentType(field);
    const properties = this.generateComponentProps(field, componentType);

    const component: ComponentInstance = {
      id: generateComponentId(),
      properties
    };

    // 处理对象类型的嵌套结构
    if (field.isObject && field.children) {
      component.children = this.generateEditorConfig(field.children);
      // 为子组件设置父级关系
      component.children.forEach((child) => {
        child.parent = component.id;
      });
    }

    return component;
  }

}

export default TypeScriptParser;
