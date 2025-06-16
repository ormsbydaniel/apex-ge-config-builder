
import { DataSource } from '@/types/config';

export interface LayerActionConfig {
  onEdit?: (index: number) => void;
  onEditBase?: (index: number) => void;
  onDuplicate?: (index: number) => void;
  onRemove?: (index: number) => void;
  onMove?: (fromIndex: number, toIndex: number) => void;
  onAddDataSource?: (layerIndex: number) => void;
}

export const createLayerActionHandlers = (config: LayerActionConfig) => {
  return {
    handleEdit: config.onEdit || (() => {}),
    handleEditBase: config.onEditBase || (() => {}),
    handleDuplicate: config.onDuplicate || (() => {}),
    handleRemove: config.onRemove || (() => {}),
    handleMove: config.onMove || (() => {}),
    handleAddDataSource: config.onAddDataSource || (() => {})
  };
};

export interface FormActionConfig {
  onSave?: (data: any) => void;
  onCancel?: () => void;
  onValidate?: (data: any) => boolean;
}

export const createFormActionHandlers = (config: FormActionConfig) => {
  return {
    handleSave: config.onSave || (() => {}),
    handleCancel: config.onCancel || (() => {}),
    handleValidate: config.onValidate || (() => true)
  };
};

export const createStandardizedProps = <T extends Record<string, any>>(
  baseProps: T,
  overrides: Partial<T> = {}
): T => {
  return { ...baseProps, ...overrides };
};
