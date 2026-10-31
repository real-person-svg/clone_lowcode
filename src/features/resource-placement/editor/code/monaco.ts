import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';

(
  self as typeof self & {
    MonacoEnvironment?: { getWorker(moduleId: string, label: string): Worker };
  }
).MonacoEnvironment = {
  getWorker(_moduleId: string, label: string) {
    return label === 'json' ? new JsonWorker() : new EditorWorker();
  },
};
monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
  validate: true,
  allowComments: false,
  schemas: [],
  enableSchemaRequest: false,
});
loader.config({ monaco });
