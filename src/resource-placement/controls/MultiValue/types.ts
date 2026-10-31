import type { LocalUploadProps } from '../Upload';

export interface LanguageValue {
  $fieldType: 'LAN_FIELD';
  starling_default?: string;
  starling_list: { UserConfigTypeValue: string; Value: string }[];
  config_type: 1 | 2;
}
export interface MultiValueProps extends Omit<
  LocalUploadProps,
  'value' | 'onChange'
> {
  value?: string | LanguageValue;
  onChange?: (value: string | LanguageValue) => void;
  optionList?: { value: string; label: string }[];
}
