import React, { useEffect, useState } from 'react';
import { Toast, Upload, withField } from '@douyinfe/semi-ui';
import type { FileItem } from '@douyinfe/semi-ui/lib/es/upload/interface';
import { IconPlus } from '@douyinfe/semi-icons';

function LocalImage({
  value,
  onChange
}: {
  value?: string | null;
  onChange?: (value: string | null) => void;
}) {
  const [files, setFiles] = useState<FileItem[]>([]);
  useEffect(() => {
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
  return (
    <Upload
      action="/api/assets/upload"
      name="file"
      accept="image/*"
      listType="picture"
      limit={1}
      fileList={files}
      onChange={({ fileList }) => setFiles(fileList)}
      onSuccess={(response) => onChange?.((response as { url: string }).url)}
      onRemove={() => {
        onChange?.(null);
        return true;
      }}
      onError={() => Toast.error('上传失败，请重新上传')}
    >
      <IconPlus size="extra-large" />
    </Upload>
  );
}
export const FormImage = withField(LocalImage, {
  valueKey: 'value',
  onKeyChangeFnName: 'onChange'
});
