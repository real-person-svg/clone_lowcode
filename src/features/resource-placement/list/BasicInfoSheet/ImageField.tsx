import React, { useEffect, useState } from 'react';
import { Toast, Upload, withField } from '@douyinfe/semi-ui';
import type { FileItem } from '@douyinfe/semi-ui/lib/es/upload/interface';
import { IconPlus } from '@douyinfe/semi-icons';

/** 将单张资源位示例图上传接入表单，并同步图片地址。 */
function LocalImage({
  value,
  onChange
}: {
  value?: string | null;
  onChange?: (value: string | null) => void;
}) {
  const [files, setFiles] = useState<FileItem[]>([]);
  useEffect(/* 把外部图片地址转换为上传控件的成功文件项。 */ () => {
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
      onChange={/* 同步上传控件当前文件列表。 */ ({ fileList }) => setFiles(fileList)}
      onSuccess={/* 上传成功时将服务器地址写入表单。 */ (response) => onChange?.((response as { url: string }).url)}
      onRemove={/* 移除图片时清空表单值，并允许控件删除文件项。 */ () => {
        onChange?.(null);
        return true;
      }}
      onError={/* 显示示例图上传失败提示。 */ () => Toast.error('上传失败，请重新上传')}
    >
      <IconPlus size="extra-large" />
    </Upload>
  );
}
export const FormImage = withField(LocalImage, {
  valueKey: 'value',
  onKeyChangeFnName: 'onChange'
});
