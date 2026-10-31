import React from 'react';
import MultiValue, { type MultiValueProps } from '../MultiValue';
import styles from './style.module.scss';
/** 复用多值控件编辑按语言或地区配置的图片地址。 */
export default function StarlingUpload(props: MultiValueProps) {
  return <MultiValue {...props} upload styles={styles} />;
}
