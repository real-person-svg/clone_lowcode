import { useEffect, useState } from 'react';
import { Toast } from '@douyinfe/semi-ui';
import type { FileItem } from '@douyinfe/semi-ui/lib/es/upload/interface';

export interface ExampleImageProps {
  value?: string | null;
  onChange?: (value: string | null) => void;
}

export function useExampleImage({ value, onChange }: ExampleImageProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  useEffect(
    /* 把外部图片地址转换为上传控件的成功文件项。 */
    () => {
      setFiles(
        value
          ? [
            {
              uid: value,
              status: 'success',
              size: '0 B',
              url: value,
              name: value
            }
          ]
          : []
      );
    }, [value]);

  const change = ({ fileList }: { fileList: FileItem[] }) => setFiles(fileList);

  const success = (response: unknown) => onChange?.((response as { url: string }).url);

  const remove = () => {
    onChange?.(null);
    return true;
  };

  const error = () => Toast.error('上传失败，请重新上传');

  return { files, change, success, remove, error };
}
