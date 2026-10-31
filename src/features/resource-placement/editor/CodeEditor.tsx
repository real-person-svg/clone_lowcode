import './monaco';
import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import Editor from '@monaco-editor/react';
import type { editor as MonacoEditor } from 'monaco-editor';
import { Modal, withField } from '@douyinfe/semi-ui';

import { recordLifecycleMetric } from './performance';

interface CodeEditorProps {
  initCodeValue?: string;
  documentKey?: string;
  onOk?: (val: string) => void;
  onCancel?: () => void;
  modelConfig?: {
    visible: boolean;
  };
  onCodeChange?: (v: string) => void;
  language?: 'json' | 'typescript';
  title?: string;
  footer?: React.ReactNode;
  description?: string;
  restProps?: {
    height?: string;
    value?: string;
    onChange?: (v: string) => void;
  };
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  initCodeValue,
  documentKey,
  modelConfig,
  onOk,
  onCancel,
  language = 'json',
  title = '编辑资源位',
  footer,
  onCodeChange,
  description = '请输入JSON配置数据：',
  restProps
}) => {
  const [codeValue, setCodeValue] = useState('');
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
  const formattingTimer = useRef<ReturnType<typeof setTimeout>>();
  const activeDocument = useRef<string>();
  const syncingDocument = useRef(false);
  const fieldValue = restProps?.value ?? '';
  const currentDocument = useRef({ key: documentKey, value: fieldValue });

  const syncDocument = () => {
    const document = currentDocument.current;
    const editor = editorRef.current;
    if (!editor || !document.key || activeDocument.current === document.key) {
      return;
    }
    clearTimeout(formattingTimer.current);
    syncingDocument.current = true;
    try {
      // setValue starts a fresh undo history while reusing the editor and model.
      editor.getModel()?.setValue(document.value);
      editor.setPosition({ lineNumber: 1, column: 1 });
      editor.setScrollTop(0);
      activeDocument.current = document.key;
    } finally {
      syncingDocument.current = false;
    }
  };

  useLayoutEffect(() => {
    currentDocument.current = { key: documentKey, value: fieldValue };
    syncDocument();
  }, [documentKey, fieldValue]);
  useEffect(
    () => () => {
      clearTimeout(formattingTimer.current);
    },
    []
  );

  // 弹窗打开编辑器时，以新传进来的内容为准
  useEffect(() => {
    if (modelConfig?.visible) {
      setCodeValue(initCodeValue ?? '');
    } else if (modelConfig) {
      clearTimeout(formattingTimer.current);
      editorRef.current = null;
      activeDocument.current = undefined;
    }
  }, [modelConfig?.visible, initCodeValue]);

  // 打开编辑器时，格式化代码
  const formatEditorCode = (editor: MonacoEditor.IStandaloneCodeEditor, monaco: typeof import('monaco-editor')) => {
    editorRef.current = editor;
    recordLifecycleMetric('monacoMounts');
    syncDocument();
    const model = editor.getModel();
    if (model && monaco) {
      // 根据语言类型设置编辑器
      monaco.editor.setModelLanguage(model, language);
      monaco.editor.setTheme('vs-dark');

      if (language === 'json') {
        // 设置 JSON 语言配置
        monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
          validate: true,
          allowComments: false,
          schemas: [],
          enableSchemaRequest: false
        });
        // 设置 JSON 语言服务配置
        monaco.languages.json.jsonDefaults.setModeConfiguration({
          documentFormattingEdits: true,
          documentRangeFormattingEdits: true,
          completionItems: true,
          hovers: true,
          documentSymbols: true,
          tokens: true,
          colors: true,
          foldingRanges: true,
          diagnostics: true,
          selectionRanges: true
        });
      } else if (language === 'typescript') {
        // 设置 TypeScript 语言配置
        monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
          noSemanticValidation: false,
          noSyntaxValidation: false
        });
        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
          target: monaco.languages.typescript.ScriptTarget.ES2015,
          allowNonTsExtensions: true
        });
      }

      // 格式化函数
      const formatDocument = () => {
        const currentValue = editor.getValue();
        if (!currentValue?.trim()) {
          return;
        }

        if (language === 'json') {
          formatJsonDocument(editor, currentValue);
        } else {
          formatTypescriptDocument(editor);
        }
      };

      // 立即格式化（如果有内容且是 JSON）
      if (language === 'json') {
        formattingTimer.current = setTimeout(formatDocument, 100);
      }
    }
  };

  // 格式化 JSON 文档
  const formatJsonDocument = (editor: any, currentValue: string) => {
    try {
      // 验证并格式化 JSON
      const parsed = JSON.parse(currentValue);
      const formatted = JSON.stringify(parsed, null, 2);
      if (formatted !== currentValue) {
        editor.setValue(formatted);
      }
    } catch (error) {
      // 如果 JSON 格式无效，尝试使用编辑器的格式化命令
      formatTypescriptDocument(editor);
    }
  };

  // 格式化 TypeScript 文档
  const formatTypescriptDocument = (editor: any) => {
    const action = editor.getAction('editor.action.formatDocument');
    if (action) {
      action.run().catch((formatError: unknown) => {
        console.warn('格式化失败:', formatError);
      });
    }
  };

  const renderEditor = (otherProps?: any) => (
    <Editor
      height={otherProps?.height || "600px"}
      defaultLanguage={language}
      language={language}
      {...otherProps}
      value={modelConfig ? codeValue : fieldValue}
      onChange={(value) => {
        if (syncingDocument.current) {
          return;
        }
        const nextValue = value ?? '';
        if (!modelConfig) {
          otherProps?.onChange?.(nextValue);
        } else {
          setCodeValue(nextValue);
          onCodeChange?.(nextValue);
        }
      }}
      onMount={formatEditorCode}
      theme="vs-dark"
      options={{
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        wordWrap: 'on',
        formatOnPaste: true,
        formatOnType: language === 'json',
        tabSize: 2,
        insertSpaces: true,
        detectIndentation: false,
        renderWhitespace: 'selection',
        bracketPairColorization: {
          enabled: true
        }
      }}
    />
  );
  if (!modelConfig) {
    return renderEditor(restProps || {});
  }
  return (
    <Modal
      title={title}
      visible={modelConfig?.visible}
      onOk={() => onOk?.(codeValue)}
      onCancel={onCancel}
      width={800}
      height={800}
      okText="确定"
      cancelText="取消"
      {...(footer ? { footer } : {})}
    >
      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8, color: '#666' }}>{description}</div>
        {renderEditor()}
      </div>
    </Modal>
  );
};

export default CodeEditor;

export const FormCodeEditor = withField(
  ({ componentId, documentValue, ...restProps }: Record<string, any>) => (
    <CodeEditor
      documentKey={componentId}
      language="json"
      restProps={{
        height: '300px',
        ...restProps,
        value: documentValue ?? restProps.value ?? ''
      }}
    />
  ),
  {
    shouldMemo: false
  }
);
