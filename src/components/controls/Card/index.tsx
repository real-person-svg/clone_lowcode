import React, { CSSProperties, useState } from 'react';
import {
  IconChevronDown,
  IconChevronUp,
  IconHelpCircleStroked,
} from '@douyinfe/semi-icons';
import { Collapsible } from '@douyinfe/semi-ui';

import ControlTitle from '../Title';
import ControlTooltip from '../Tooltip';

import styles from './style.module.scss';

export interface Props {
  title: string;
  children: React.ReactNode;
  size?: 'default' | 'small'; // 默认为default
  style?: CSSProperties;
  type?: 'solidGroup'; // 卡片样式
  tips?: string | Array<string>; // 提示
  foldable?: boolean; // 是否可折叠的
}

const sizeClassNameMap = {
  default: '',
  small: styles.small,
};

/** 渲染带标题、提示和可选折叠能力的内容卡片。 */
const Card = ({
  title,
  children,
  size = 'default',
  style,
  type,
  foldable = true,
  tips,
}: Props) => {
  const [isOpen, setOpen] = useState(true);
  /** 切换卡片内容的展开状态。 */
  const toggle = () => {
    setOpen(!isOpen);
  };
  const tipNode = tips ? (
    <ControlTooltip tips={tips}>
      <IconHelpCircleStroked className={styles['tips_icon']} />
    </ControlTooltip>
  ) : null;
  if (type === 'solidGroup') {
    return (
      <div className={styles['group_card']} style={style}>
        <div className={styles.title}>
          {title}
          {tipNode}
        </div>
        <div className={styles['card_content']}>{children}</div>
      </div>
    );
  }

  return (
    <div
      className={`${styles['card_wrapper']} ${sizeClassNameMap[size]}`}
      style={style}
    >
      <div className={styles['card_header']}>
        <div className={styles['title_wrapper']}>
          <ControlTitle value={title} size={size} />
          {tipNode}
        </div>
        {foldable && (
          <div className={styles['fold_icon']} onClick={toggle}>
            {' '}
            {isOpen ? <IconChevronUp /> : <IconChevronDown />}{' '}
          </div>
        )}
      </div>
      <div className={styles['card_content']}>
        {foldable ? (
          <Collapsible isOpen={isOpen} keepDOM={true}>
            {children}
          </Collapsible>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default Card;
