import { Button } from '@douyinfe/semi-ui';
import { IconArrowLeft } from '@douyinfe/semi-icons';
import { useEditorHeader } from './useEditorHeader';
import type { ResourcePlacementInfo } from '../configuration/types';
import styles from './style.module.scss';

interface EditorHeaderProps {
  resource: ResourcePlacementInfo;
  saving: boolean;
  onOpenCode: () => void;
  onSave: () => void;
}

/** 展示当前资源身份与业务线，提供返回、代码编辑和保存入口。 */
export default function EditorHeader({ resource, saving, onOpenCode, onSave }: EditorHeaderProps) {
  const { businessLabel, openCode, goBack } = useEditorHeader(resource, onOpenCode);

  return (
    <header className={styles.header}>
      <Button icon={<IconArrowLeft />} onClick={goBack}>
        返回
      </Button>
      <div className={styles.headerTitle}>
        <div className={styles.mainTitle}>资源位配置</div>
        <div className={styles.resourceInfo}>
          <span title={resource.resourceKey}>资源位Key: {resource.resourceKey}</span>
          <span title={resource.resourceName}>资源位名称: {resource.resourceName}</span>
          <span>业务端: {businessLabel}</span>
          <span>环境: {resource.env}</span>
        </div>
      </div>
      <div className={styles.headerExtra}>
        <Button theme="solid" type="primary" onClick={openCode}>代码编辑</Button>
        <Button theme="solid" type="primary" loading={saving} onClick={onSave}>保存</Button>
      </div>
    </header>
  );
}
