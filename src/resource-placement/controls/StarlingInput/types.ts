export interface StarlingValue {
  $fieldType: 'STARLING_FIELD';
  type: string;
  value: string;
  variables?: { type?: number; key: string; value: string }[];
  languages?: Record<string, string>;
}

export interface StarlingInputProps {
  value?: StarlingValue;
  onChange?: (value: StarlingValue) => void;
  disabled?: boolean;
}
