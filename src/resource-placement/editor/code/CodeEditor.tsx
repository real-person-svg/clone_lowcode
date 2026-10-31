import './monaco';
import React from 'react';
import Editor from '@monaco-editor/react';
import { Modal, withField } from '@douyinfe/semi-ui';
import { useCodeEditor } from './useCodeEditor';
import { editorOptions } from './editorOptions';
import type { CodeEditorProps } from './types';

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
  const { editorHeight, editorValue, handleEditorChange, handleEditorMount, confirm } = useCodeEditor({
    initCodeValue, documentKey, modelConfig, onOk, restProps,
  });

  const codeEditor = (
    <Editor
      height={editorHeight}
      language="json"
      value={editorValue}
      onChange={handleEditorChange}
      onMount={handleEditorMount}
      theme="vs-dark"
      options={editorOptions}
    />
  );

  if (!modelConfig) return codeEditor;
  return (
    <Modal
      title={title}
      visible={modelConfig.visible}
      onOk={confirm}
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
  ({ componentId, documentValue, ...restProps }: Record<string, any>) => {
    const editorProps = {
      height: '300px',
      ...restProps,
      value: documentValue ?? restProps.value ?? '',
    };

    return <CodeEditor documentKey={componentId} restProps={editorProps} />;
  },
  { shouldMemo: false },
);
