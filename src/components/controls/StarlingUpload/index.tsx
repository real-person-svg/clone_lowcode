import React from 'react';
import MultiValue, { type MultiValueProps } from '../MultiValue';
import styles from './style.module.scss';
export default function StarlingUpload(props: MultiValueProps) {
  return <MultiValue {...props} upload styles={styles} />;
}
