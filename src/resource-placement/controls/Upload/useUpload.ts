import { useEffect, useState } from 'react';
import type { UploadProps } from '@douyinfe/semi-ui/lib/es/upload';
import { Toast } from '@douyinfe/semi-ui';
import type { FileItem, customRequestArgs } from '@douyinfe/semi-ui/lib/es/upload/interface';
import { uploadAsset } from '../../api/client';
import { validateImage } from './validateImage';
import type { LocalUploadProps } from './types';

const emptyFiles: string[] = [];

export function useUpload({
  type = 'image',
  value = emptyFiles,
  onChange,
  limit = 1,
  disabled,
  accept,
  maxSize,
  supportSize,
  supportRatio
}: LocalUploadProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  useEffect(
    /* 将外部地址列表同步为上传控件的文件状态。 */
    () => {
      setFiles(
        /* 地址未变化时保留原列表，避免丢失正在上传的状态。 */
        (previous) => {
          const urls = previous
            .filter(
              /* 筛选已上传成功的文件。 */
              (file) => file.status === 'success')
            .map(
              /* 提取成功文件地址用于比较。 */
              (file) => file.url);
          return JSON.stringify(urls) === JSON.stringify(value)
            ? previous
            : value.map(
              /* 将外部地址转换为可展示的成功文件项。 */
              (url) => ({
                uid: url,
                name: url.split('/').pop() || url,
                url,
                status: 'success',
                size: '0',
                preview: type === 'image',
              }));
        });
    }, [value, type]);

  /** 校验大小和图片约束后上传资源，并回报上传结果。 */
  const customRequest = async ({
    fileInstance,
    onSuccess,
    onError,
  }: customRequestArgs) => {
    try {
      if (maxSize && fileInstance.size > maxSize * 1024) {
        throw new Error(`文件大小需要小于 ${(maxSize / 1024).toFixed(2)}M`);
      }
      if (type === 'image') {
        await validateImage(fileInstance, supportSize, supportRatio);
      }
      const asset = await uploadAsset(fileInstance);
      onSuccess(asset);
    } catch (error) {
      Toast.error(
        error instanceof Error ? error.message : '上传失败，请重新上传',
      );
      onError({ status: 400 });
    }
  };

  const preview = (file: FileItem) => {
    if (file.url) window.open(file.url, '_blank', 'noopener');
  };

  const change: NonNullable<UploadProps['onChange']> = ({ fileList }) => {
    const next = fileList.map((file) => ({ ...file, url: file.response?.url ?? file.url }));
    setFiles(next);

    const urls = next.filter((file) => file.status === 'success' && file.url).map((file) => file.url!);
    if (JSON.stringify(urls) !== JSON.stringify(value)) onChange?.(urls);
  };

  const defaultAccept = type === 'image' ? 'image/*' : '.mp4';
  const acceptedTypes = accept ?? defaultAccept;
  const uploadDisabled = disabled || files.length >= limit;

  return { files, customRequest, preview, change, acceptedTypes, uploadDisabled };
}
