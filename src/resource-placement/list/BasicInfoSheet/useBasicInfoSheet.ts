import { useRef, useState } from 'react';
import { Toast } from '@douyinfe/semi-ui';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form/interface';
import type { ResourcePlacement } from '@shared/types';
import { api } from '../../api/client';
import { initialValues, resourceInput, type SheetMode, type Values } from './values';

const titles: Record<SheetMode, string> = {
  create: '新建资源位',
  edit: '编辑资源位',
  copy: '复制资源位',
  child: '创建子版本'
};

export interface BasicInfoSheetProps {
  mode: SheetMode;
  record?: ResourcePlacement;
  onClose: () => void;
  onSaved: () => void;
}

export function useBasicInfoSheet({ mode, record, onClose, onSaved }: BasicInfoSheetProps) {
  const form = useRef<FormApi<Partial<Values>>>();
  const [saving, setSaving] = useState(false);
  const isEdit = mode === 'edit';
  const initial = initialValues(mode, record);

  /** 按当前模式提交资源位数据，编辑时携带修订号检测冲突。 */
  const submit = async (values: Values) => {
    setSaving(true);
    try {
      const data = resourceInput(mode, values, record);
      if (isEdit) {
        await api.update({
          ...data,
          id: record!.id,
          revision: record!.revision
        });
      }
      else await api.create(data);
      Toast.success(isEdit ? '更新成功' : '创建成功');
      onSaved();
      onClose();
    } catch (error) {
      Toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const title = titles[mode];

  const submitForm = () => form.current?.submitForm();

  const setFormApi = (value: FormApi<Partial<Values>>) => {
    form.current = value;
  };

  const handleSubmit = (values: Partial<Values>) => void submit(values as Values);

  return { isEdit, initial, saving, title, submitForm, setFormApi, handleSubmit };
}
