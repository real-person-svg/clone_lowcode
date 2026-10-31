import React, { useState } from 'react';
import { Checkbox } from '@douyinfe/semi-ui';
import type { ResourcePlacement } from '@shared/types';

/** 展示发布确认内容及发布后清理来源的选项。 */
export default function PublishConfirmContent({
  record,
  onChange
}: {
  record: ResourcePlacement;
  onChange: (checked: boolean) => void;
}) {
  const [checked, setChecked] = useState(true);

  const change = (event: { target: { checked?: boolean } }) => {
    const next = Boolean(event.target.checked);
    setChecked(next);
    onChange(next);
  };

  return (
    <div>
      <p>
        是否确认将资源位「{record.resourceName}
        」发布到线上环境？确认后会使用该泳道的资源位配置，覆盖到 online
        环境的相同资源位
      </p>
      <Checkbox
        checked={checked}
        onChange={change}
      >
        发布后自动删除对应泳道数据
      </Checkbox>
    </div>
  );
}
