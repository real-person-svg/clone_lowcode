import { Input } from '@douyinfe/semi-ui';
import Upload from '../Upload';
import type { LocalUploadProps } from '../Upload/types';

interface ValueInputProps {
  upload: boolean;
  text?: string;
  onChange: (text: string) => void;
  placeholder: string;
  uploadProps: Omit<LocalUploadProps, 'value' | 'onChange'>;
}

export default function ValueInput({ upload, text, onChange, placeholder, uploadProps }: ValueInputProps) {
  const urls = text ? [text] : [];
  const inputValue = text ?? '';

  const changeUpload = (values: string[]) => onChange(values[0] ?? '');

  if (upload) return <Upload {...uploadProps} value={urls} onChange={changeUpload} />;

  return <Input
    disabled={uploadProps.disabled}
    style={{ width: '100%' }}
    value={inputValue}
    placeholder={placeholder}
    onChange={onChange}
  />;
}
