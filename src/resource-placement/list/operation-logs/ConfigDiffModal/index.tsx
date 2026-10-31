import React from 'react';
import { Modal, Typography } from '@douyinfe/semi-ui';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer';
import { customStyles } from './theme';
import { useConfigDiff } from './useConfigDiff';

import styles from './style.module.scss';

const { Text } = Typography;

interface Props {
  visible: boolean;
  oldConfig?: {
    [key: string]: any;
  };
  newConfig?: {
    [key: string]: any;
  };
  onClose: () => void;
}

/** 并排展示操作前后配置差异，提供两侧配置复制。 */
const ConfigDiffModal: React.FC<Props> = ({
  visible,
  oldConfig,
  newConfig,
  onClose
}) => {
  const { oldConfigText, newConfigText, copyOld, copyNew, empty } = useConfigDiff(oldConfig, newConfig);

  return (
    <Modal
      title="差异比对"
      visible={visible}
      width={1500}
      footer={null}
      onCancel={onClose}
    >
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {empty ? (
          <div className={styles['empty-text']}>
            <Text type="tertiary">暂无配置变更记录</Text>
          </div>
        ) : (
          <div className="diff-wrapper">
            <ReactDiffViewer
              oldValue={oldConfigText}
              newValue={newConfigText}
              splitView={true}
              compareMethod={DiffMethod.WORDS}
              leftTitle={
                <div>
                  <span>变更前</span>
                  <Typography.Text
                    link
                    onClick={copyOld}
                  >
                    复制
                  </Typography.Text>
                </div>
              }
              rightTitle={
                <div>
                  <span>变更后</span>
                  <Typography.Text
                    link
                    onClick={copyNew}
                  >
                    复制
                  </Typography.Text>
                </div>
              }
              showDiffOnly={false}
              hideLineNumbers={false}
              styles={customStyles}
              useDarkTheme={false}
            />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ConfigDiffModal;
