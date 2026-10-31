import { useLayoutEffect, useRef, useState } from 'react';
import type { editor as MonacoEditor } from 'monaco-editor';
import { formatJsonDocument } from './jsonDocument';

export function useJsonDocument(key: string | undefined, source: string) {
  const [document, setDocument] = useState(() => ({
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
    const sameDocumentInput = document.key === key && source === lastInput.current;
    setDocument({
      key,
      source,
      value: sameDocumentInput ? source : formatJsonDocument(source),
    });
  }
  currentDocument.current = document;

  const syncDocument = () => {
    const editor = editorRef.current;
    const current = currentDocument.current;
    if (!editor || !current.key || activeKey.current === current.key) return;
    syncing.current = true;
    try {
      // A selection switch starts a fresh undo history; typing never resets the model.
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

  const mount = (editor: MonacoEditor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    syncDocument();
  };
  const change = (value: string, publish: (value: string) => void) => {
    if (syncing.current) return;
    lastInput.current = value;
    setDocument((current) => ({ ...current, value }));
    publish(value);
  };

  return { value: document.value, mount, change };
}
