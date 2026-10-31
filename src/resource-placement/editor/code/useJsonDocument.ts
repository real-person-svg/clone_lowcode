import { useLayoutEffect, useRef, useState } from 'react';
import type { editor as MonacoEditor } from 'monaco-editor';
import { formatJsonDocument } from './jsonDocument';

/** 管理字段 JSON 文档，区分输入回显与组件切换时的文档重置。 */
export function useJsonDocument(key: string | undefined, source: string) {
  const [document, setDocument] = useState(
    /* 用初始来源创建格式化的字段文档。 */
    () => ({
      key,
      source,
      value: formatJsonDocument(source),
    }));
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
  const activeKey = useRef<string>();
  const syncing = useRef(false);
  const lastInput = useRef<string>();
  const currentDocument = useRef(document);

  if (document.key !== key || document.source !== source) {
    // 父表单回显刚输入的文本时保持原样；外部来源或组件身份变化才重新格式化。
    const sameDocumentInput = document.key === key && source === lastInput.current;
    setDocument({
      key,
      source,
      value: sameDocumentInput ? source : formatJsonDocument(source),
    });
  }
  currentDocument.current = document;

  /** 切换文档身份时重置编辑器内容、光标和撤销历史。 */
  const syncDocument = () => {
    const editor = editorRef.current;
    const current = currentDocument.current;
    if (!editor || !current.key || activeKey.current === current.key) return;
    syncing.current = true;
    try {
      // 切换组件身份才重置模型和撤销历史，同一文档内的输入不调用 setValue。
      editor.getModel()?.setValue(current.value);
      editor.setPosition({ lineNumber: 1, column: 1 });
      editor.setScrollTop(0);
      activeKey.current = current.key;
      lastInput.current = undefined;
    } finally {
      syncing.current = false;
    }
  };

  useLayoutEffect(syncDocument, [key]);

  /** 保存 Monaco 实例并同步当前文档。 */
  const mount = (editor: MonacoEditor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    syncDocument();
  };

  /** 忽略程序同步引发的变更，将用户输入发布到表单。 */
  const change = (value: string, publish: (value: string) => void) => {
    if (syncing.current) return;
    lastInput.current = value;
    setDocument(
      /* 保留文档身份和来源，仅更新正在编辑的文本。 */
      (current) => ({ ...current, value }));
    publish(value);
  };

  return { value: document.value, mount, change };
}
