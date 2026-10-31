import type { AddComponentHandler, ComponentInstance } from '../configuration/types';

export interface ComponentRendererProps {
  component: ComponentInstance;
  index: number;
  fieldPrefix?: string;
  onUpdateComponent: (id: string, updates: Partial<ComponentInstance>) => void;
  onRemoveComponent: (id: string) => void;
  onMove: (
    dragId: string,
    hoverId: string,
    dropPosition: 'before' | 'after' | 'inside',
  ) => void;
  onSelectComponent: (componentId?: string) => void;
  onAddComponent: AddComponentHandler;
}

export interface CanvasProps {
  components: ComponentInstance[];
  selectionStore: import('../state/selectionStore').SelectionStore;
  onSelectComponent: (componentId?: string) => void;
  onUpdateComponent: (
    componentId: string,
    updates: Partial<ComponentInstance>,
  ) => void;
  onRemoveComponent: (componentId: string) => void;
  onMoveComponent: (
    dragId: string,
    hoverId: string,
    dropPosition: 'before' | 'after' | 'inside',
  ) => void;
  onAddComponent: AddComponentHandler;
}
