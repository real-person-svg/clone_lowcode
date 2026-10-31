import React, { useRef, useCallback, useState, useLayoutEffect, useEffect } from 'react';
import { Toast } from '@douyinfe/semi-ui';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form/interface';
import { cloneDeep } from 'lodash';
import type { ComponentInstance, PropertyConfig } from '../configuration/types';
import { PropertyConfigManager } from './PropertyConfigManager';
import { COMPONENT_CONFIGS } from '../library/componentConfigs';
import { getTypeChangeError } from '../configuration/componentCapabilities';
import { recordLifecycleMetric } from '../runtime/performance';

/** 同步选中组件与属性表单，隔离程序回填和用户编辑。 */
export function usePropertyForm(
  selectedComponent: ComponentInstance | null,
  onUpdateComponent: (id: string, updates: Partial<ComponentInstance>) => void,
) {
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
  /** 缓存高级属性字段名，用于判断是否默认展开高级面板。 */
  const advancedPropertyKeys = React.useMemo(
    () =>
      PropertyConfigManager.getAdvancedProperties()
        .map(
          /* 提取高级属性的字段名。 */
          (property) => property.key!)
        .filter(Boolean),
    [],
  );

  useEffect(
    /* 记录属性面板的挂载次数。 */
    () => {
      recordLifecycleMetric('panelMounts');
    }, []);

  /** 保存属性表单 API，供回填及属性联动使用。 */
  const setFormApi = useCallback((formApi: FormApi<PropertyConfig>) => {
    form.current = formApi;
  }, []);

  const selectedId = selectedComponent?.id;
  const selectedProperties = selectedComponent?.properties;

  useLayoutEffect(
    /* 按组件身份回填属性，切换时清除旧校验状态并避免回填触发写回。 */
    () => {
      if (!selectedProperties) {
        loadedSelection.current = undefined;
        setShowHiddenAdvanced(false);
        return;
      }

      lastSelected.current = {
        id: selectedId!,
        properties: selectedProperties,
      };
      const selectionChanged = loadedSelection.current !== selectionKey;
      // 面板刚发布的同一份属性无需再次回填，避免打断输入光标或代码文档。
      if (
        !selectionChanged &&
        selectedProperties === lastPublished.current
      ) {
        return;
      }

      // 组件的高级属性有默认值，则展开高级属性配置面板
      const componentType = selectedProperties?.type;
      const componentConfig = componentType
        ? Object.values(COMPONENT_CONFIGS).find(
          /** 查找当前组件类型对应的默认属性。 */
          (config) => config.defaultProps?.type === componentType,
        )
        : undefined;
      const componentDefaultProps = componentConfig?.defaultProps || {};
      // 有默认值或配了值，就展开高级配置
      const showAdvancedPanel = Boolean(
        advancedPropertyKeys.some(
          /* 检查高级属性是否有默认值或已配置值。 */
          (key) =>
            Boolean(
              componentDefaultProps[key] ||
              Boolean(selectedProperties[key]),
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
            Object.keys(errors || {}).forEach(
              /* 切换组件时清除旧字段的错误提示。 */
              (key) =>
                form.current!.setError(key as keyof PropertyConfig, undefined),
            );
            Object.keys(touched || {}).forEach(
              /* 切换组件时清除旧字段的触碰状态。 */
              (key) =>
                form.current!.setTouched(key as keyof PropertyConfig, false),
            );
          }
          // 完整覆盖可清除下一组件不存在的属性；syncing 标记阻止程序回填被当成用户编辑。
          const values = { ...selectedProperties };
          if (Array.isArray(values.asyncInject)) {
            values.asyncInject = JSON.stringify(values.asyncInject);
          }
          if (typeof values.isShow === 'boolean') {
            values.isShow = String(values.isShow);
          }
          form.current.setValues(values, { isOverride: true });
          lastPublished.current = selectedProperties;
        } finally {
          syncing.current = false;
        }
      }
    }, [selectionKey, selectedId, selectedProperties, advancedPropertyKeys]);

  /** 校验类型切换约束，规范化特殊属性后发布用户修改。 */
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
        /* 编辑过程中保留未完成的 JSON 文本，保存时再执行完整配置校验。 */
      }
    }
    lastPublished.current = properties;
    onUpdateComponent(selectedComponent.id, { properties });
  };

  const toggleAdvanced = () => setShowHiddenAdvanced((previous) => !previous);

  const baseProperties = displayedComponent ? PropertyConfigManager.getBaseProperties(displayedComponent) : [];
  const advancedProperties = PropertyConfigManager.getAdvancedProperties();
  const advancedStyle = { display: showHiddenAdvanced ? 'block' : 'none' };
  const advancedLabel = showHiddenAdvanced ? '收起' : '展开';

  return {
    toggleAdvanced,
    baseProperties,
    advancedProperties,
    advancedStyle,
    advancedLabel,
    form,
    displayedComponent,
    showHiddenAdvanced,
    setShowHiddenAdvanced,
    setFormApi,
    handleValueChange
  };
}
