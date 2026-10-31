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
    await new Promise<void>(
      /* 等待图片加载完成后才能读取尺寸。 */
      (resolve, reject) => {
        image.onload =
          /* 图片加载成功时允许继续校验。 */
          () => resolve();
        image.onerror =
          /* 图片加载失败时中止上传校验。 */
          () => reject(new Error('图片加载失败'));
        image.src = url;
      });
    if (
      supportSize.length &&
      !supportSize.includes(`${image.width}*${image.height}`)
    ) {
      throw new Error(
        `尺寸不符合要求，支持的尺寸为：${supportSize.join('、')}`,
      );
    }
    if (
      supportRatio.length &&
      !supportRatio.some(
        /* 允许宽高比误差小于 0.01，避免比例计算的微小偏差。 */
        (ratio) => {
          const [w, h] = ratio.split(':').map(Number);
          return (
            w > 0 && h > 0 && Math.abs(image.width / image.height - w / h) < 0.01
          );
        })
    ) {
      throw new Error(
        `比例不符合要求，支持的比例为：${supportRatio.join('、')}`,
      );
    }
  } finally {
    URL.revokeObjectURL(url);
  }
}
