/** 字符串按十进制整数解析，已有数字保持原值。 */
export const getNumber = (value: string | number) =>
  typeof value === 'string' ? Number.parseInt(value, 10) : value;
