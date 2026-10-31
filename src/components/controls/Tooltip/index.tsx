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

/** 展示单张提示图片，或以轮播展示多张提示图片。 */
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
        {imgList.map(/* 为轮播中的每张提示图片生成节点。 */ (src, index) => (
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

/** 为子元素提供文本或图片提示内容。 */
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
