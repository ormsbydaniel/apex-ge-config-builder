/**
 * Form-related type definitions
 */

import { Service } from './service';
import { DataSource } from './layer';

export interface SourceFormProps {
  interfaceGroups: string[];
  services: Service[];
  onAddSource: (source: DataSource) => void;
  onAddService: (service: Service) => void;
  onCancel: () => void;
}
