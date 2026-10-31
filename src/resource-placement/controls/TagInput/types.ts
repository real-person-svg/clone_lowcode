export interface InputTagPanelProps {
  value: Array<string>;
  onChange: (value: InputTagPanelProps['value']) => void;
  // 分割符号
  separator?: Array<string>;
  color?: string;
  placeholder?: string;
  isRowDirection?: boolean;
  disabled?: boolean;
}
