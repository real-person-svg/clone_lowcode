import React from 'react';
import MultiValue, { type MultiValueProps } from '../MultiValue';
import styles from './style.module.scss';
export default function StarlingSchema(props: MultiValueProps) {
  return <MultiValue {...props} styles={styles} />;
}
