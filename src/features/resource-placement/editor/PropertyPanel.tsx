import React, {
  useRef,
  useCallback,
  useState,
  useLayoutEffect,
  useEffect,
} from 'react';
import { Typography, Form, Empty, Tooltip, Button } from '@douyinfe/semi-ui';
import {
  IconHelpCircleStroked,
  IconChevronDown,
  IconChevronUp,
} from '@douyinfe/semi-icons';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form/interface';
import { cloneDeep } from 'lodash';

import { ComponentInstance, PropertyConfig } from './types';
import { PropertyConfigManager } from './PropertyConfigManager';
import { COMPONENT_CONFIGS } from './componentConfigs';
import { getTypeChangeError } from './componentCapabilities';
import { Toast } from '@douyinfe/semi-ui';
import { recordLifecycleMetric } from './performance';

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
  onUpdateComponent: (
    componentId: string,
    updates: Partial<ComponentInstance>,
  ) => void;
}

const PropertyPanel: React.FC<PropertyPanelProps> = ({
  selectedComponent,
  onUpdateComponent,
}) => {
  useEffect(() => {
    recordLifecycleMetric('panelMounts');
  }, []);
  const form = useRef<FormApi<PropertyConfig> | null>(null);
  const lastSelected = useRef<ComponentInstance | null>(null);
  const syncing = useRef(false);
  const loadedSelection = useRef<string>();
  const lastPublished = useRef<PropertyConfig>();
  const displayedComponent = selectedComponent || lastSelected.current;
  const selectionKey = selectedComponent
    ? `${selectedComponent.id}__${selectedComponent.properties.type}`
    : undefined;
  const [showHiddenAdvanced, setShowHiddenAdvanced] = useState(false);
  const advancedPropertyKeys = React.useMemo(
    () =>
      PropertyConfigManager.getAdvancedProperties()
        .map((property) => property.key!)
        .filter(Boolean),
    [],
  );

  const setFormApi = useCallback((formApi: FormApi<PropertyConfig>) => {
    form.current = formApi;
  }, []);

  useLayoutEffect(() => {
    if (!selectedComponent) {
      loadedSelection.current = undefined;
      setShowHiddenAdvanced(false);
      return;
    }

    lastSelected.current = {
      id: selectedComponent.id,
      properties: selectedComponent.properties,
    };
    const selectionChanged = loadedSelection.current !== selectionKey;
    if (
      !selectionChanged &&
      selectedComponent.properties === lastPublished.current
    ) {
      return;
    }

    // 组件的高级属性有默认值，则展开高级属性配置面板
    const componentType = selectedComponent.properties?.type;
    const componentConfig = componentType
      ? Object.values(COMPONENT_CONFIGS).find(
          (config) => config.defaultProps?.type === componentType,
        )
      : undefined;
    const componentDefaultProps = componentConfig?.defaultProps || {};
    // 有默认值或配了值，就展开高级配置
    const showAdvancedPanel = Boolean(
      advancedPropertyKeys.some((key) =>
        Boolean(
          componentDefaultProps[key] ||
          Boolean(selectedComponent.properties[key]),
        ),
      ),
    );
    if (selectionChanged) {
      setShowHiddenAdvanced(showAdvancedPanel);
    }

    if (form.current) {
      syncing.current = true;
      try {
        loadedSelection.current = selectionKey;
        if (selectionChanged) {
          const { errors, touched } = form.current.getFormState();
          Object.keys(errors || {}).forEach((key) =>
            form.current!.setError(key as keyof PropertyConfig, undefined),
          );
          Object.keys(touched || {}).forEach((key) =>
            form.current!.setTouched(key as keyof PropertyConfig, false),
          );
        }
        // Override also removes properties absent from the next component.
        form.current.setValues(
          {
            ...selectedComponent.properties,
            ...(Array.isArray(selectedComponent.properties.asyncInject)
              ? {
                  asyncInject: JSON.stringify(
                    selectedComponent.properties.asyncInject,
                  ),
                }
              : {}),
            ...(typeof selectedComponent.properties.isShow === 'boolean'
              ? { isShow: String(selectedComponent.properties.isShow) }
              : {}),
          },
          { isOverride: true },
        );
        lastPublished.current = selectedComponent.properties;
      } finally {
        syncing.current = false;
      }
    }
  }, [selectionKey, selectedComponent?.properties, advancedPropertyKeys]);

  const handleValueChange = (newValues: PropertyConfig) => {
    if (
      !selectedComponent ||
      syncing.current ||
      loadedSelection.current !== selectionKey
    ) {
      return;
    }
    const properties = cloneDeep(newValues);
    const typeError = getTypeChangeError(selectedComponent, properties.type);
    if (typeError) {
      Toast.warning(typeError);
      syncing.current = true;
      try {
        form.current?.setValue('type', selectedComponent.properties.type);
      } finally {
        syncing.current = false;
      }
      return;
    }
    if (properties.isShow === 'true') properties.isShow = true;
    if (properties.isShow === 'false') properties.isShow = false;
    if (typeof properties.asyncInject === 'string') {
      try {
        properties.asyncInject = properties.asyncInject.trim()
          ? JSON.parse(properties.asyncInject)
          : undefined;
      } catch {
        /* Keep incomplete input editable; save validates the full configuration. */
      }
    }
    lastPublished.current = properties;
    onUpdateComponent(selectedComponent.id, { properties });
  };

  /**
   * 渲染统一属性字段
   */
  const renderUnifiedPropertyField = (property: PropertyConfig) => {
    const {
      key,
      label,
      require,
      tips,
      placeholder,
      disabled,
      props,
      component: Component,
    } = property;

    if (!key || !Component || !displayedComponent) return null;
    // 处理校验规则
    const rules = [];
    if (require) {
      rules.push({ required: true, message: `${label}不能为空` });
    }

    return (
      <div key={key} style={{ marginBottom: 16 }}>
        <Component
          label={
            tips
              ? {
                  text: label,
                  extra: (
                    <Tooltip content={tips}>
                      <IconHelpCircleStroked style={{ color: '#8f959e' }} />
                    </Tooltip>
                  ),
                }
              : label
          }
          field={key}
          rules={rules}
          disabled={disabled}
          placeholder={placeholder}
          componentId={`${displayedComponent.id}__${displayedComponent.properties.type}__${key}`}
          {...(key === 'cProps'
            ? { documentValue: displayedComponent.properties.cProps ?? '' }
            : {})}
          style={{ width: '100%' }}
          {...props}
          onChange={(newVal: any) => props?.onChange?.(newVal, form)}
        />
        {key === 'type' && Boolean(selectedComponent?.children?.length) && (
          <Text type="secondary" size="small">
            当前组件包含子组件，请先移出或删除子组件后再切换为非容器类型
          </Text>
        )}
      </div>
    );
  };

  return (
    <div className={styles.propertyPanel}>
      <div className={styles.panelHeader}>
        <Title heading={6}>属性配置</Title>
        {/* {selectedComponent && <Text type="secondary">{selectedComponent.properties.type}</Text>} */}
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
                renderUnifiedPropertyField,
              )}
              <div className={styles.advancedSection}>
                <div
                  className={styles.advancedHeader}
                  role="button"
                  tabIndex={0}
                  onClick={() => setShowHiddenAdvanced((prev) => !prev)}
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
                    renderUnifiedPropertyField,
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
