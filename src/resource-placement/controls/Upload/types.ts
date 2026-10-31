export interface LocalUploadProps {
  type?: 'image' | 'video';
  value?: string[];
  onChange?: (value: string[]) => void;
  listType?: 'picture' | 'list';
  limit?: number;
  disabled?: boolean;
  accept?: string;
  maxSize?: number;
  supportSize?: string[];
  supportRatio?: string[];
}
