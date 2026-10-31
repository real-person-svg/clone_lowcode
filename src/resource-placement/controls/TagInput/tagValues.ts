/** 保留分隔、去重和空白处理的顺序，返回重复项信息供界面提示。 */
export function mergeTags(value: string[], pendingString: string, separator?: string[]) {
  let separatorRegExp = null;
  if (Array.isArray(separator) && separator.length) {
    separatorRegExp = new RegExp(`\\${separator.join('|\\')}`, 'g');
  }
  const addTags = pendingString
    .split(separatorRegExp ?? /(?!) /)
    .filter(
      /* 过滤分隔产生的空项。 */
      (i) => Boolean(i))
    ?.map(
      /* 去除每项标签首尾空白。 */
      (item) => item?.trim());
  // 先保留已有顺序再合并新项，用 Set 去重；合并结果数量减少时提示存在重复项。
  const newTags = [...new Set([...value, ...addTags])];
  const hasDuplicates = newTags.length !== value.length + addTags.length;

  return { newTags, hasDuplicates };
}
