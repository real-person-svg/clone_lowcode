import { useEffect, useState } from 'react';
import { Toast } from '@douyinfe/semi-ui';
import { api } from '@/features/resource-placement/api/client';
import { parseConfig } from '@shared/config';
import { useEditorState } from '../state/hooks';
import { transformConfigToEditorData, transformEditorDataToConfig } from '../configuration/dataTransform';
import { validateAllComponents } from '../configuration/utils';
import { useCodeModalSnapshot } from '../code/useCodeModalSnapshot';

/** 将未知异常转换为可展示的文本。 */
const errorMessage = (error: unknown) => error instanceof Error ? error.message : String(error);

/** 协调资源加载、配置保存、JSON 导入和代码弹窗会话。 */
export function useEditorSession() {
  const state = useEditorState();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const code = useCodeModalSnapshot(/* 按需将当前编辑器树序列化为代码弹窗快照。 */ () => JSON.stringify(transformEditorDataToConfig(state.editorConfig)));
  const { getResourceDetail } = state;

  useEffect(/* 加载当前路由资源，并在清理后忽略本轮加载状态回写。 */ () => {
    let active = true;
    setLoading(true);
    setLoadError('');
    getResourceDetail()
      .catch(/* 仅在本轮加载仍有效时展示错误。 */ (error) => { if (active) setLoadError(errorMessage(error)); })
      .finally(/* 仅在本轮加载仍有效时结束加载状态。 */ () => { if (active) setLoading(false); });
    return /* 使本轮加载的后续状态回写失效。 */ () => { active = false; };
  }, [getResourceDetail]);

  /** 校验必填项后携带修订号保存配置，并更新保存状态。 */
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
      state.setCurResourceDetail(/* 仅当当前详情仍是同一资源时替换服务端返回的数据。 */ (current) => current?.id === detail.id ? detail : current);
      state.resetChanges();
      Toast.success('保存成功');
    } catch (error) {
      Toast.error(`保存失败: ${errorMessage(error)}`);
    } finally {
      setSaving(false);
    }
  };

  /** 校验并导入 JSON 配置，成功后关闭代码弹窗。 */
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
