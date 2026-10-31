import React, { useRef, useCallback, useState, useLayoutEffect, useEffect } from 'react';
import { Toast } from '@douyinfe/semi-ui';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form/interface';
import { cloneDeep } from 'lodash';
import type { ComponentInstance, PropertyConfig } from '../configuration/types';
import { PropertyConfigManager } from './PropertyConfigManager';
import { COMPONENT_CONFIGS } from '../library/componentConfigs';
import { getTypeChangeError } from '../configuration/componentCapabilities';
import { recordLifecycleMetric } from '../runtime/performance';

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
  const advancedPropertyKeys = React.useMemo(
    () =>
      PropertyConfigManager.getAdvancedProperties()
        .map((property) => property.key!)
        .filter(Boolean),
    [],
  );

  useEffect(() => {
    recordLifecycleMetric('panelMounts');
  }, []);

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


  return { form, displayedComponent, showHiddenAdvanced, setShowHiddenAdvanced, setFormApi, handleValueChange };
}
