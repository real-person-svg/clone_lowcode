export interface CodeEditorProps {
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
