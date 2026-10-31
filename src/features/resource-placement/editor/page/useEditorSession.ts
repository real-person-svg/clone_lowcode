import { useEffect, useState } from 'react';
import { Toast } from '@douyinfe/semi-ui';
import { api } from '@/features/resource-placement/api/client';
import { parseConfig } from '@shared/config';
import { useEditorState } from '../state/hooks';
import { transformConfigToEditorData, transformEditorDataToConfig } from '../configuration/dataTransform';
import { validateAllComponents } from '../configuration/utils';
import { useCodeModalSnapshot } from '../code/useCodeModalSnapshot';

const errorMessage = (error: unknown) => error instanceof Error ? error.message : String(error);

export function useEditorSession() {
  const state = useEditorState();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const code = useCodeModalSnapshot(() => JSON.stringify(transformEditorDataToConfig(state.editorConfig)));
  const { getResourceDetail } = state;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError('');
    getResourceDetail()
      .catch((error) => { if (active) setLoadError(errorMessage(error)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [getResourceDetail]);

  const save = async () => {
    const resource = state.curResourceDetail;
    if (!resource?.id) return;
    try {
      setSaving(true);
      const validation = validateAllComponents(state.editorConfig);
      if (!validation.valid) {
        const first = validation.invalidComponents[0];
        state.setSelectedComponent(first.component.id);
        throw new Error(`组件 "${first.component.properties.label || ''}" 存在必填项未填写：${first.errors.join('、')}`);
      }
      const config = transformEditorDataToConfig(state.editorConfig);
      const detail = await api.update({
        id: resource.id,
        revision: resource.revision,
        configData: JSON.stringify(config),
      });
      state.setCurResourceDetail((current) => current?.id === detail.id ? detail : current);
      state.resetChanges();
      Toast.success('保存成功');
    } catch (error) {
      Toast.error(`保存失败: ${errorMessage(error)}`);
    } finally {
      setSaving(false);
    }
  };

  const importJson = (value: string) => {
    try {
      parseConfig(value);
      state.updateComponents(transformConfigToEditorData(value));
      code.close();
    } catch (error) {
      Toast.error(`修改失败: ${errorMessage(error)}`);
    }
  };

  return { ...state, code, loading, loadError, saving, save, importJson };
}
