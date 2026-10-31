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
/** 按配置校验图片像素尺寸与宽高比，并释放临时对象地址。 */
export async function validateImage(
  file: File,
  supportSize: string[] = [],
  supportRatio: string[] = [],
) {
  if (!supportSize.length && !supportRatio.length) return;
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>(/* 等待图片加载完成后才能读取尺寸。 */ (resolve, reject) => {
      image.onload = /* 图片加载成功时允许继续校验。 */ () => resolve();
      image.onerror = /* 图片加载失败时中止上传校验。 */ () => reject(new Error('图片加载失败'));
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
      !supportRatio.some(/* 允许宽高比误差小于 0.01，避免比例计算的微小偏差。 */ (ratio) => {
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
/** 包装本地资源上传，维护文件列表并向表单输出成功文件地址。 */
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
  React.useEffect(/* 将外部地址列表同步为上传控件的文件状态。 */ () => {
    setFiles(/* 地址未变化时保留原列表，避免丢失正在上传的状态。 */ (previous) => {
      const urls = previous
        .filter(/* 筛选已上传成功的文件。 */ (file) => file.status === 'success')
        .map(/* 提取成功文件地址用于比较。 */ (file) => file.url);
      return JSON.stringify(urls) === JSON.stringify(value)
        ? previous
        : value.map(/* 将外部地址转换为可展示的成功文件项。 */ (url) => ({
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
      onPreviewClick={/* 在新窗口中预览已有文件地址。 */ (file) => {
        if (file.url) window.open(file.url, '_blank', 'noopener');
      }}
      onChange={/* 同步上传响应地址，并仅将成功文件列表发布给表单。 */ ({ fileList }) => {
        const next = fileList.map(/* 用服务器返回的地址补全文件项。 */ (file) => ({
          ...file,
          url: file.response?.url ?? file.url,
        }));
        setFiles(next);
        const urls = next
          .filter(/* 筛选上传成功且存在地址的文件。 */ (file) => file.status === 'success' && file.url)
          .map(/* 提取需要写入表单的资源地址。 */ (file) => file.url!);
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
