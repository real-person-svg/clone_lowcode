import React, { type ReactNode } from 'react';
import { Button } from '@douyinfe/semi-ui';
import styles from './Header.module.scss';
export interface HeaderProps {
  title?: string | ReactNode;
  operateLabel?: string;
  operateClick?: () => void;
  operateNode?: ReactNode;
  className?: string;
}
export default function Header({
  title,
  operateLabel,
  operateClick,
  operateNode,
  className
}: HeaderProps) {
  return (
    <div className={`${styles.header_wrapper} ${className || ''}`}>
      {title && <div className={styles.title}>{title}</div>}
      {operateNode ||
        (operateLabel && operateClick && (
          <div className={styles.operate_wrapper}>
            <Button
              theme="solid"
              type="primary"
              onClick={operateClick}
              className={styles.operate_btn}
            >
              {operateLabel}
            </Button>
          </div>
        ))}
    </div>
  );
}
