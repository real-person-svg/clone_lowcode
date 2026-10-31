import type * as Monaco from 'monaco-editor';

export const editorOptions: Monaco.editor.IStandaloneEditorConstructionOptions = {
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
};
