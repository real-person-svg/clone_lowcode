import { useEffect, useState } from 'react';
import type { OnChange, OnMount } from '@monaco-editor/react';
import { recordLifecycleMetric } from '../runtime/performance';
import { formatJsonDocument } from './jsonDocument';
import { useJsonDocument } from './useJsonDocument';
import type { CodeEditorProps } from './types';

export function useCodeEditor({ initCodeValue, documentKey, modelConfig, onOk, restProps }: CodeEditorProps) {
  const [codeValue, setCodeValue] = useState('');
  const field = useJsonDocument(documentKey, restProps?.value ?? '');

  useEffect(
    /* 打开弹窗时将初始配置格式化为本轮编辑内容。 */
    () => {
      if (modelConfig?.visible) {
        setCodeValue(formatJsonDocument(initCodeValue ?? ''));
      }
    }, [modelConfig?.visible, initCodeValue]);

  let editorHeight = restProps?.height;
  if (editorHeight == null) {
    editorHeight = modelConfig ? 'min(600px, 65vh)' : '300px';
  }
  const editorValue = modelConfig ? codeValue : field.value;

  const handleEditorChange: OnChange = (value) => {
    const next = value ?? '';
    if (modelConfig) setCodeValue(next);
    else field.change(next, (input) => restProps?.onChange?.(input));
  };

  const handleEditorMount: OnMount = (editor) => {
    recordLifecycleMetric('monacoMounts');
    if (!modelConfig) field.mount(editor);
  };

  const confirm = () => onOk?.(codeValue);

  return { editorHeight, editorValue, handleEditorChange, handleEditorMount, confirm };
}
