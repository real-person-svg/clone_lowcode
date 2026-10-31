/** 字符串按十进制整数解析，已有数字保持原值。 */
export const getNumber = (value: string | number) =>
  typeof value === 'string' ? Number.parseInt(value, 10) : value;

/** 尝试将符合当前识别条件的 RGBA 文本转换为色板接受的分量对象。 */
export const getRGBAColor = (val: string | undefined) => {
  if (val && typeof val === 'string' && /^rgba\($/g.test(val)) {
    const [r, g, b, a] = val
      .replace(/^rgba\(/g, '')
      .replace(/\)/g, '')
      .split(',')
      .map(
        /* 将颜色分量文本转换为数字。 */
        (i) => {
          i.trim();
          return getNumber(i);
        });
    return { r, g, b, a };
  }
  return val;
};
