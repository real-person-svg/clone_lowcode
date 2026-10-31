import React from 'react';
import { Form } from '@douyinfe/semi-ui';
import { basicFields, yesNo, frequencyOptions } from './fields';

/** 展示频控、推荐和 AB 实验等资源位业务选项。 */
export default function BusinessOptionsFields() {
  return (
    <>
      <Form.Select
        field="showFrequencyControl"
        label={basicFields.showFrequencyControl.label}
        optionList={frequencyOptions}
        showClear={false}
        style={{ width: '100%' }}
      />
      <Form.Select
        field="showReco"
        label={basicFields.showReco.label}
        optionList={yesNo}
        showClear={false}
        style={{ width: '100%' }}
      />
      <Form.Select
        field="abExperimentOptionEnabled"
        label={basicFields.abExperimentOptionEnabled.label}
        optionList={yesNo}
        showClear={false}
        style={{ width: '100%' }}
      />
      <Form.Input
        field="pageFrom"
        label={basicFields.pageFrom.label}
        placeholder="请输入 pageFrom"
      />
    </>
  );
}
