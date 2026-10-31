import React from 'react';
import { Upload, withField } from '@douyinfe/semi-ui';
import { useExampleImage } from './useExampleImage';
import { IconPlus } from '@douyinfe/semi-icons';

/** 将单张资源位示例图上传接入表单，并同步图片地址。 */
function LocalImage({
  value,
  onChange
}: {
  value?: string | null;
  onChange?: (value: string | null) => void;
}) {
  const { files, change, success, remove, error } = useExampleImage({ value, onChange });

  return (
    <Upload
      action="/api/assets/upload"
      name="file"
      accept="image/*"
      listType="picture"
      limit={1}
      fileList={files}
      onChange={change}
      onSuccess={success}
      onRemove={remove}
      onError={error}
    >
      <IconPlus size="extra-large" />
    </Upload>
  );
}

export const FormImage = withField(LocalImage, {
  valueKey: 'value',
  onKeyChangeFnName: 'onChange'
});
