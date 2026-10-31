import React from 'react';
import { Button, Upload } from '@douyinfe/semi-ui';
import { IconUpload, IconPlus } from '@douyinfe/semi-icons';
import { useUpload } from './useUpload';
import type { LocalUploadProps } from './types';
import styles from './style.module.scss';
export type { LocalUploadProps } from './types';
export { validateImage } from './validateImage';

/** 包装本地资源上传，展示文件列表及上传入口。 */
export default function ControlUpload(props: LocalUploadProps) {
  const { listType = 'picture', limit = 1, disabled } = props;
  const { files, customRequest, preview, change, acceptedTypes, uploadDisabled } = useUpload(props);

  return (
    <Upload
      className={styles.control_upload_wrapper}
      action="/api/assets/upload"
      customRequest={customRequest}
      accept={acceptedTypes}
      listType={listType}
      limit={limit}
      disabled={disabled}
      fileList={files}
      onPreviewClick={preview}
      onChange={change}
    >
      {listType === 'list' ? (
        <Button icon={<IconUpload />} theme="light" disabled={uploadDisabled}>点击上传</Button>
      ) : (
        <IconPlus size="extra-large" />
      )}
    </Upload>
  );
}
