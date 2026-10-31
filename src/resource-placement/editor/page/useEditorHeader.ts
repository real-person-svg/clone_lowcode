import { Toast } from '@douyinfe/semi-ui';
import { useNavigate } from 'react-router-dom';
import { appList } from '@shared/types';
import type { ResourcePlacementInfo } from '../configuration/types';

export function useEditorHeader(resource: ResourcePlacementInfo, onOpenCode: () => void) {
  const navigate = useNavigate();
  const businessLabel = appList.find(
    /* 匹配当前资源所属业务线。 */
    (item) => item.value === resource.bizId)?.label;

  /** 打开代码弹窗，并展示配置生成失败的原因。 */
  const openCode = () => {
    try {
      onOpenCode();
    } catch (error) {
      Toast.error(`配置生成失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const goBack = () => navigate('/lowcode');

  return { businessLabel, openCode, goBack };
}
