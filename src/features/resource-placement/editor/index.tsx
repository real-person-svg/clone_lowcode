import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Empty, Layout, Spin } from '@douyinfe/semi-ui';
import { Link } from 'react-router-dom';
import ComponentLibrary from './library/ComponentLibrary';
import Canvas from './canvas/Canvas';
import PropertyPanel from './properties/PropertyPanel';
import CodeEditor from './code/CodeEditor';
import EditorHeader from './page/EditorHeader';
import { useEditorSession } from './page/useEditorSession';
import styles from './page/style.module.scss';

const { Sider, Content } = Layout;

export default function ResourcePlacementLowCodeEditor() {
  const editor = useEditorSession();
  const resource = editor.curResourceDetail;

  if (editor.loading) return <div className={styles.loadingContainer}><Spin size="large" /></div>;
  if (editor.loadError || !resource) {
    return (
      <div className={styles.loadingContainer}>
        <Empty title="资源位加载失败" description={editor.loadError || '资源位不存在'}>
          <Link to="/lowcode">返回资源位列表</Link>
        </Empty>
      </div>
    );
  }

  return (
    <div className={styles.lowCodeEditor}>
      <EditorHeader resource={resource} saving={editor.saving} onSave={editor.save} onOpenCode={editor.code.open} />
      <DndProvider backend={HTML5Backend}>
        <Layout className={styles.editorLayout}>
          <Sider className={styles.leftSider}><ComponentLibrary onAddComponent={editor.addComponent} /></Sider>
          <Content className={styles.canvasContainer}>
            <Canvas
              components={editor.editorConfig}
              selectionStore={editor.selectionStore}
              onSelectComponent={editor.setSelectedComponent}
              onUpdateComponent={editor.updateComponent}
              onRemoveComponent={editor.removeComponent}
              onMoveComponent={editor.moveComponent}
              onAddComponent={editor.addComponent}
            />
          </Content>
          <Sider className={styles.rightSider}>
            <PropertyPanel selectedComponent={editor.selectedComponent} onUpdateComponent={editor.updateComponent} />
          </Sider>
        </Layout>
      </DndProvider>
      {editor.code.snapshot !== undefined && (
        <CodeEditor
          modelConfig={{ visible: editor.code.visible }}
          initCodeValue={editor.code.snapshot}
          onOk={editor.importJson}
          onCancel={editor.code.close}
        />
      )}
    </div>
  );
}
