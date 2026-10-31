import React from 'react';
import { Form } from '@douyinfe/semi-ui';
import { fieldLabel } from '../FieldLabel';

const yesNo = [
  { label: '否', value: 0 },
  { label: '是', value: 1 }
];

export default function BusinessOptionsFields() {
  return (
    <>
      <Form.Select
        field="showFrequencyControl"
        label={fieldLabel('是否展示频控', false)}
        optionList={[
          { label: '是', value: 1 },
          { label: '否', value: 0 }
        ]}
        showClear={false}
        style={{ width: '100%' }}
      />
      <Form.Select
        field="showReco"
        label={fieldLabel(
          '是否支持开启算法开关',
          false,
          '打开时则 Vimo 资源位配置页面会展示「是否开启算法推荐」'
        )}
        optionList={yesNo}
        showClear={false}
        style={{ width: '100%' }}
      />
      <Form.Select
        field="abExperimentOptionEnabled"
        label={fieldLabel(
          '是否支持切换实验类型',
          false,
          '打开时可选择切换服务端实验和客户端 SDK 实验'
        )}
        optionList={yesNo}
        showClear={false}
        style={{ width: '100%' }}
      />
      <Form.Input
        field="pageFrom"
        label={fieldLabel(
          '埋点参数 pageFrom',
          false,
          '用于资源位配置跳转链接时，自动取该字段拼接到跳转链接的 ?page_form 参数中给端上上报埋点'
        )}
        placeholder="请输入 pageFrom"
      />
    </>
  );
}
