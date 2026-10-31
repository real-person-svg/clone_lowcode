import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import hooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['node_modules/**', 'dist/**', 'data/**', 'coverage/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      // 配置驱动的控件与 Semi 字段适配保留动态属性类型。
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrors: 'none',
        ignoreRestSiblings: true
      }],
      'no-nested-ternary': 'error',
      'no-inline-comments': 'error',
      'prefer-const': 'error',
      'curly': ['error', 'multi-line'],
      'no-restricted-syntax': ['error', {
        selector: 'SpreadElement > ConditionalExpression',
        message: '先初始化结果，再通过 if 按条件追加或赋值。'
      }]
    }
  },
  {
    files: ['server/**/*.ts'],
    rules: {
      'lines-between-class-members': ['error', 'always'],
      'no-restricted-syntax': ['error',
        {
          selector: 'SpreadElement > ConditionalExpression',
          message: '先初始化结果，再通过 if 按条件追加或赋值。'
        },
        {
          selector: 'TemplateLiteral > :matches(CallExpression, ConditionalExpression, ArrayExpression, ObjectExpression)',
          message: '在模板字符串外准备数据，模板中只引用命名清楚的值。'
        },
        {
          selector: 'CallExpression[callee.property.name=/^(run|all|get)$/] > SpreadElement > CallExpression',
          message: '先准备数据库参数，再执行查询或写入。'
        }
      ]
    }
  },
  {
    files: ['src/**/*.{ts,tsx}', 'tests/resource-placement/**/*.{ts,tsx}'],
    plugins: { react, 'react-hooks': hooks },
    rules: {
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'no-restricted-syntax': ['error',
        { selector: 'SpreadElement > ConditionalExpression', message: '先初始化结果，再通过 if 按条件追加或赋值。' },
        {
          selector: 'JSXAttribute > JSXExpressionContainer > :matches(ArrowFunctionExpression, FunctionExpression)',
          message: '提前定义事件处理函数，JSX 直接绑定函数名。'
        },
        { selector: 'JSXAttribute > JSXExpressionContainer > ConditionalExpression', message: '在 JSX 外准备属性值，再直接绑定。' },
        {
          selector: 'JSXAttribute > JSXExpressionContainer > ObjectExpression[properties.length>3]',
          message: '将复杂属性对象提前组装，或提取为静态配置。'
        }
      ]
    }
  },
  {
    files: ['tests/**/*.{ts,tsx}'],
    rules: { 'react-hooks/exhaustive-deps': 'off', 'no-restricted-syntax': 'off' }
  }
);
