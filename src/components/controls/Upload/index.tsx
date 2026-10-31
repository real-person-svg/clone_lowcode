import React from 'react';
import { Button, Toast, Upload } from '@douyinfe/semi-ui';
import { IconUpload, IconPlus } from '@douyinfe/semi-icons';
import type {
  FileItem,
  customRequestArgs,
} from '@douyinfe/semi-ui/lib/es/upload/interface';
import { uploadAsset } from '@/features/resource-placement/api/client';
import styles from './style.module.scss';

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
const emptyFiles: string[] = [];
export async function validateImage(
  file: File,
  supportSize: string[] = [],
  supportRatio: string[] = [],
) {
  if (!supportSize.length && !supportRatio.length) return;
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('图片加载失败'));
      image.src = url;
    });
    if (
      supportSize.length &&
      !supportSize.includes(`${image.width}*${image.height}`)
    )
      throw new Error(
        `尺寸不符合要求，支持的尺寸为：${supportSize.join('、')}`,
      );
    if (
      supportRatio.length &&
      !supportRatio.some((ratio) => {
        const [w, h] = ratio.split(':').map(Number);
        return (
          w > 0 && h > 0 && Math.abs(image.width / image.height - w / h) < 0.01
        );
      })
    )
      throw new Error(
        `比例不符合要求，支持的比例为：${supportRatio.join('、')}`,
      );
  } finally {
    URL.revokeObjectURL(url);
  }
}
export default function ControlUpload({
  type = 'image',
  value = emptyFiles,
  onChange,
  listType = 'picture',
  limit = 1,
  disabled,
  accept,
  maxSize,
  supportSize,
  supportRatio,
}: LocalUploadProps) {
  const [files, setFiles] = React.useState<FileItem[]>([]);
  React.useEffect(() => {
    setFiles((previous) => {
      const urls = previous
        .filter((file) => file.status === 'success')
        .map((file) => file.url);
      return JSON.stringify(urls) === JSON.stringify(value)
        ? previous
        : value.map((url) => ({
            uid: url,
            name: url.split('/').pop() || url,
            url,
            status: 'success',
            size: '0',
            preview: type === 'image',
          }));
    });
  }, [value, type]);
  const customRequest = async ({
    fileInstance,
    onSuccess,
    onError,
  }: customRequestArgs) => {
    try {
      if (maxSize && fileInstance.size > maxSize * 1024)
        throw new Error(`文件大小需要小于 ${(maxSize / 1024).toFixed(2)}M`);
      if (type === 'image')
        await validateImage(fileInstance, supportSize, supportRatio);
      const asset = await uploadAsset(fileInstance);
      onSuccess(asset);
    } catch (error) {
      Toast.error(
        error instanceof Error ? error.message : '上传失败，请重新上传',
      );
      onError({ status: 400 });
    }
  };
  return (
    <Upload
      className={styles.control_upload_wrapper}
      action="/api/assets/upload"
      customRequest={customRequest}
      accept={accept ?? (type === 'image' ? 'image/*' : '.mp4')}
      listType={listType}
      limit={limit}
      disabled={disabled}
      fileList={files}
      onPreviewClick={(file) => {
        if (file.url) window.open(file.url, '_blank', 'noopener');
      }}
      onChange={({ fileList }) => {
        const next = fileList.map((file) => ({
          ...file,
          url: file.response?.url ?? file.url,
        }));
        setFiles(next);
        const urls = next
          .filter((file) => file.status === 'success' && file.url)
          .map((file) => file.url!);
        if (JSON.stringify(urls) !== JSON.stringify(value)) onChange?.(urls);
      }}
    >
      {listType === 'list' ? (
        <Button
          icon={<IconUpload />}
          theme="light"
          disabled={disabled || files.length >= limit}
        >
          点击上传
        </Button>
      ) : (
        <IconPlus size="extra-large" />
      )}
    </Upload>
  );
}
