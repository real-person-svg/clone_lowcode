import React, { ReactNode } from 'react';
import { Carousel, Tooltip } from '@douyinfe/semi-ui';

import styles from './style.module.scss';

interface CarouselTipProps {
  imgList: Array<string>;
  isHorizontal?: boolean;
}

export interface Props {
  tips: Array<string> | string;
  isHorizontal?: boolean;
  children: ReactNode | undefined | any;
}

const horizontalStyle = {
  width: '240px',
  height: '80px',
};

const CarouselTip = ({
  imgList = [],
  isHorizontal = false,
}: CarouselTipProps) =>
  imgList.length > 1 ? (
    <div
      className={styles['controls_carousel_tips_wrapper']}
      style={isHorizontal ? horizontalStyle : {}}
    >
      <Carousel className={styles['controls_carousel_tips']} theme="light">
        {imgList.map((src, index) => (
          <img src={src} className={styles['img_item']} key={src} />
        ))}
      </Carousel>
    </div>
  ) : (
    <img
      src={imgList[0]}
      className={styles['controls_picture_tips']}
      style={isHorizontal ? horizontalStyle : {}}
    />
  );

const ControlTooltip = ({ tips, isHorizontal, children }: Props) => (
  <Tooltip
    content={
      Array.isArray(tips) ? (
        <CarouselTip isHorizontal={isHorizontal} imgList={tips} />
      ) : (
        tips
      )
    }
  >
    {children}
  </Tooltip>
);

export default ControlTooltip;
