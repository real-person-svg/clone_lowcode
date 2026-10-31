import React, { useMemo } from 'react';
import { Modal, Typography, Toast } from '@douyinfe/semi-ui';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer';
import type { ReactDiffViewerStylesOverride } from 'react-diff-viewer';
import { formatDiffConfig } from '../snapshots';

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

const ConfigDiffModal: React.FC<Props> = ({
  visible,
  oldConfig,
  newConfig,
  onClose
}) => {
  const { oldConfigText, newConfigText } = useMemo(
    () => ({
      oldConfigText: formatDiffConfig(oldConfig),
      newConfigText: formatDiffConfig(newConfig)
    }),
    [oldConfig, newConfig]
  );

  const copyConfig = async (text: string) => {
    try {
      await navigator.clipboard.writeText(
        text ? JSON.stringify(JSON.parse(text)) : ''
      );
      Toast.success('复制成功');
    } catch {
      Toast.error('复制失败，请重试');
    }
  };

  const customStyles: ReactDiffViewerStylesOverride = {
    variables: {
      light: {
        codeFoldGutterBackground: '#f7f7f7',
        codeFoldBackground: '#f1f8ff',
        addedBackground: '#e6ffed',
        addedColor: '#24292e',
        removedBackground: '#ffeef0',
        removedColor: '#24292e',
        wordAddedBackground: '#acf2bd',
        wordRemovedBackground: '#fdb8c0',
        addedGutterBackground: '#cdffd8',
        removedGutterBackground: '#fdbcc0',
        gutterBackground: '#f7f7f7',
        gutterBackgroundDark: '#f7f7f7',
        highlightBackground: '#fffbdd',
        highlightGutterBackground: '#fff5b4'
      }
    }
  };

  return (
    <Modal
      title="差异比对"
      visible={visible}
      width={1500}
      footer={null}
      onCancel={onClose}
    >
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {!oldConfigText && !newConfigText ? (
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
                    onClick={() => void copyConfig(oldConfigText)}
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
                    onClick={() => void copyConfig(newConfigText)}
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
