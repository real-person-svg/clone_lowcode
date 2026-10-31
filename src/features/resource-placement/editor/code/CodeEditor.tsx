import './monaco';
import React, { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Modal, withField } from '@douyinfe/semi-ui';
import { recordLifecycleMetric } from '../runtime/performance';
import { formatJsonDocument } from './jsonDocument';
import { useJsonDocument } from './useJsonDocument';

interface CodeEditorProps {
  initCodeValue?: string;
  documentKey?: string;
  onOk?: (value: string) => void;
  onCancel?: () => void;
  modelConfig?: { visible: boolean };
  title?: string;
  description?: string;
  restProps?: {
    height?: string;
    value?: string;
    onChange?: (value: string) => void;
  };
}

/** 提供弹窗和表单两种 JSON 编辑入口，并管理各自的文档值。 */
const CodeEditor: React.FC<CodeEditorProps> = ({
  initCodeValue,
  documentKey,
  modelConfig,
  onOk,
  onCancel,
  title = '编辑资源位',
  description = '请输入JSON配置数据：',
  restProps,
}) => {
  const [codeValue, setCodeValue] = useState('');
  const field = useJsonDocument(documentKey, restProps?.value ?? '');

  useEffect(/* 打开弹窗时将初始配置格式化为本轮编辑内容。 */ () => {
    if (modelConfig?.visible) {
      setCodeValue(formatJsonDocument(initCodeValue ?? ''));
    }
  }, [modelConfig?.visible, initCodeValue]);

  const codeEditor = (
    <Editor
      height={restProps?.height ?? (modelConfig ? 'min(600px, 65vh)' : '300px')}
      language="json"
      value={modelConfig ? codeValue : field.value}
      onChange={/* 将 Monaco 输入同步至弹窗状态或字段文档。 */ (value) => {
        const next = value ?? '';
        if (modelConfig) setCodeValue(next);
        else field.change(next, /* 将字段文档变化通知外部表单。 */ (input) => restProps?.onChange?.(input));
      }}
      onMount={/* 记录 Monaco 挂载，并为字段模式关联文档实例。 */ (editor) => {
        recordLifecycleMetric('monacoMounts');
        if (!modelConfig) field.mount(editor);
      }}
      theme="vs-dark"
      options={{
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        wordWrap: 'on',
        formatOnPaste: true,
        formatOnType: true,
        tabSize: 2,
        insertSpaces: true,
        detectIndentation: false,
        renderWhitespace: 'selection',
        bracketPairColorization: { enabled: true },
      }}
    />
  );

  if (!modelConfig) return codeEditor;
  return (
    <Modal
      title={title}
      visible={modelConfig.visible}
      onOk={/* 确认弹窗时提交当前编辑文本。 */ () => onOk?.(codeValue)}
      onCancel={onCancel}
      width={800}
      okText="确定"
      cancelText="取消"
    >
      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8, color: '#666' }}>{description}</div>
        {codeEditor}
      </div>
    </Modal>
  );
};

export default CodeEditor;

export const FormCodeEditor = withField(
  /** 将代码编辑器接入表单，按组件身份区分独立文档。 */
  ({ componentId, documentValue, ...restProps }: Record<string, any>) => (
    <CodeEditor
      documentKey={componentId}
      restProps={{
        height: '300px',
        ...restProps,
        value: documentValue ?? restProps.value ?? '',
      }}
    />
  ),
  { shouldMemo: false },
);
