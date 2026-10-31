/** 沿用清空值和日期范围的转换行为，输出毫秒时间戳。 */
export function toDateValue(value: any) {
  if (!value) return undefined;
  if (Array.isArray(value)) return value.map((item) => new Date(item).getTime());

  return new Date(value).getTime();
}
