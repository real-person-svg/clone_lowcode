import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Button, Empty, Layout, Spin, Toast, Tooltip } from '@douyinfe/semi-ui';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import { api } from '@/features/resource-placement/api/client';
import { appList } from '@shared/types';
import { parseConfig } from '@shared/config';
import ComponentLibrary from './ComponentLibrary';
import Canvas from './Canvas';
import PropertyPanel from './PropertyPanel';
import { useEditorState } from './hooks';
import {
  transformEditorDataToConfig,
  transformConfigToEditorData,
} from './dataTransform';
import { validateAllComponents } from './utils';
import CodeEditor from './CodeEditor';
import { useCodeModalSnapshot } from './useCodeModalSnapshot';
import TypeScriptParser from './TypeScriptParser';
import styles from './style.module.scss';
const { Sider, Content } = Layout;
const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

export default function ResourcePlacementLowCodeEditor() {
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [tsCode, setTsCode] = React.useState('');
  const [tsVisible, setTsVisible] = React.useState(false);
  const {
    editorConfig,
    curResourceDetail,
    setCurResourceDetail,
    selectedComponent,
    selectionStore,
    setSelectedComponent,
    addComponent,
    updateComponent,
    removeComponent,
    getResourceDetail,
    moveComponent,
    updateComponents,
    resetChanges,
  } = useEditorState();
  const {
    visible: codeVisible,
    snapshot,
    open: openCode,
    close: closeCode,
  } = useCodeModalSnapshot(() =>
    JSON.stringify(transformEditorDataToConfig(editorConfig)),
  );
  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError('');
    getResourceDetail()
      .catch((error) => {
        if (active) setLoadError(errorMessage(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [getResourceDetail]);
  const save = async () => {
    if (!curResourceDetail?.id) return;
    try {
      setSaving(true);
      const validation = validateAllComponents(editorConfig);
      if (!validation.valid) {
        const first = validation.invalidComponents[0];
        setSelectedComponent(first.component.id);
        throw new Error(
          `组件 "${first.component.properties.label || ''}" 存在必填项未填写：${first.errors.join('、')}`,
        );
      }
      const config = transformEditorDataToConfig(editorConfig);
      const detail = await api.update({
        id: curResourceDetail.id,
        revision: curResourceDetail.revision,
        configData: JSON.stringify(config),
      });
      setCurResourceDetail((current) =>
        current?.id === detail.id ? detail : current,
      );
      resetChanges();
      Toast.success('保存成功');
    } catch (error) {
      Toast.error(`保存失败: ${errorMessage(error)}`);
    } finally {
      setSaving(false);
    }
  };
  const importJson = (code: string) => {
    try {
      parseConfig(code);
      updateComponents(transformConfigToEditorData(code));
      closeCode();
    } catch (error) {
      Toast.error(`修改失败: ${errorMessage(error)}`);
    }
  };
  const inferTs = () => {
    try {
      const parser = new TypeScriptParser();
      const nodes = parser.generateEditorConfig(parser.parseInterface(tsCode));
      transformEditorDataToConfig(nodes);
      updateComponents(nodes);
      setTsVisible(false);
      Toast.success('TS 定义推导成功');
    } catch (error) {
      Toast.error(`TS 定义推导失败: ${errorMessage(error)}`);
    }
  };
  if (loading)
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
      </div>
    );
  if (loadError || !curResourceDetail)
    return (
      <div className={styles.loadingContainer}>
        <Empty title="资源位加载失败" description={loadError || '资源位不存在'}>
          <Link to="/lowcode">返回资源位列表</Link>
        </Empty>
      </div>
    );
  return (
    <div className={styles.lowCodeEditor}>
      <Header
        className={styles.header}
        title={
          <div className={styles.headerTitle}>
            <div className={styles.mainTitle}>资源位配置</div>
            <div className={styles.resourceInfo}>
              <span>资源位Key: {curResourceDetail.resourceKey}</span>
              <span>资源位名称: {curResourceDetail.resourceName}</span>
              <span>
                业务端:{' '}
                {
                  appList.find((item) => item.value === curResourceDetail.bizId)
                    ?.label
                }
              </span>
              <span>环境: {curResourceDetail.env}</span>
            </div>
          </div>
        }
        operateNode={
          <div className={styles.headerExtra}>
            <Button
              theme="solid"
              type="primary"
              onClick={() => {
                setTsCode('');
                setTsVisible(true);
              }}
            >
              TS 定义推导
            </Button>
            <Button
              theme="solid"
              type="primary"
              onClick={() => {
                try {
                  openCode();
                } catch (error) {
                  Toast.error(`配置生成失败: ${errorMessage(error)}`);
                }
              }}
            >
              代码编辑
            </Button>
            <Button
              theme="solid"
              type="primary"
              loading={saving}
              onClick={save}
            >
              保存
            </Button>
          </div>
        }
      />
      <DndProvider backend={HTML5Backend}>
        <Layout className={styles.editorLayout}>
          <Sider className={styles.leftSider}>
            <ComponentLibrary onAddComponent={addComponent} />
          </Sider>
          <Content className={styles.canvasContainer}>
            <Canvas
              components={editorConfig}
              selectionStore={selectionStore}
              onSelectComponent={setSelectedComponent}
              onUpdateComponent={updateComponent}
              onRemoveComponent={removeComponent}
              onMoveComponent={moveComponent}
              onAddComponent={addComponent}
            />
          </Content>
          <Sider className={styles.rightSider}>
            <PropertyPanel
              selectedComponent={selectedComponent}
              onUpdateComponent={updateComponent}
            />
          </Sider>
        </Layout>
      </DndProvider>
      {snapshot !== undefined && (
        <CodeEditor
          modelConfig={{ visible: codeVisible }}
          initCodeValue={snapshot}
          onOk={importJson}
          onCancel={closeCode}
          title="编辑资源位"
          description="请输入JSON配置数据："
          language="json"
        />
      )}
      <CodeEditor
        modelConfig={{ visible: tsVisible }}
        initCodeValue=""
        onCancel={() => setTsVisible(false)}
        onCodeChange={setTsCode}
        language="typescript"
        title="TS 定义推导"
        description="请粘贴进 TypeScript 的 interface 定义："
        footer={
          <div>
            <Button
              theme="light"
              type="tertiary"
              onClick={() => setTsVisible(false)}
            >
              取消
            </Button>
            <Button theme="solid" type="secondary" onClick={inferTs}>
              快速推导
            </Button>
            <Tooltip content="当前未接入 AI 推导能力">
              <span>
                <Button theme="solid" type="primary" disabled>
                  AI推导
                </Button>
              </span>
            </Tooltip>
          </div>
        }
      />
    </div>
  );
}
