import React from 'react';
import { Typography, Form, Empty, Button } from '@douyinfe/semi-ui';
import { IconChevronDown, IconChevronUp } from '@douyinfe/semi-icons';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form/interface';
import type { ComponentInstance, PropertyConfig } from '../configuration/types';
import { PropertyConfigManager } from './PropertyConfigManager';
import { usePropertyForm } from './usePropertyForm';
import PropertyField from './PropertyField';
import styles from './style.module.scss';

const { Text, Title } = Typography;
const PropertyForm = Form as unknown as React.ComponentType<{
  children: React.ReactNode;
  getFormApi: (api: FormApi<PropertyConfig>) => void;
  onValueChange: (values: PropertyConfig) => void;
  labelPosition: 'top';
}>;

interface PropertyPanelProps {
  selectedComponent: ComponentInstance | null;
  onUpdateComponent: (id: string, updates: Partial<ComponentInstance>) => void;
}

/** 展示选中组件的基础与高级属性，复用表单实例同步编辑。 */
const PropertyPanel: React.FC<PropertyPanelProps> = ({
  selectedComponent,
  onUpdateComponent,
}) => {
  const {
    form, displayedComponent, showHiddenAdvanced,
    setShowHiddenAdvanced, setFormApi, handleValueChange,
  } = usePropertyForm(selectedComponent, onUpdateComponent);
  return (
    <div className={styles.propertyPanel}>
      <div className={styles.panelHeader}>
        <Title heading={6}>属性配置</Title>
      </div>

      <div className={styles.panelContent}>
        {!selectedComponent && (
          <Empty
            title="未选择组件"
            description="请先选择一个组件以配置其属性"
          />
        )}
        <div hidden={!selectedComponent}>
          {displayedComponent && (
            <PropertyForm
              getFormApi={setFormApi}
              onValueChange={handleValueChange}
              labelPosition="top"
            >
              {PropertyConfigManager.getBaseProperties(displayedComponent).map(
                /** 渲染当前组件的基础属性字段。 */
                (property) => (
                  <PropertyField
                    key={property.key}
                    property={property}
                    displayedComponent={displayedComponent}
                    form={form}
                  />
                ),
              )}
              <div className={styles.advancedSection}>
                <div
                  className={styles.advancedHeader}
                  role="button"
                  tabIndex={0}
                  onClick={/* 切换高级属性面板展开状态。 */ () => setShowHiddenAdvanced(/* 根据上次状态反转高级属性可见性。 */ (prev) => !prev)}
                >
                  <Text type="secondary">高级配置</Text>
                  <Button
                    theme="borderless"
                    type="tertiary"
                    icon={
                      showHiddenAdvanced ? (
                        <IconChevronUp />
                      ) : (
                        <IconChevronDown />
                      )
                    }
                  >
                    {showHiddenAdvanced ? '收起' : '展开'}
                  </Button>
                </div>

                <div
                  className={styles.advancedFields}
                  style={{ display: showHiddenAdvanced ? 'block' : 'none' }}
                >
                  {PropertyConfigManager.getAdvancedProperties().map(
                    /** 渲染高级属性字段。 */
                    (property) => (
                  <PropertyField
                    key={property.key}
                    property={property}
                    displayedComponent={displayedComponent}
                    form={form}
                  />
                ),
                  )}
                </div>
              </div>
            </PropertyForm>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyPanel;
