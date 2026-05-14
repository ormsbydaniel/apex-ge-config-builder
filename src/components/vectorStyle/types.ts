/**
 * Editor field metadata used to populate attribute pickers in the value input.
 */

export interface VectorFieldDescriptor {
  name: string;
  /** Loose type hint from the source's meta.fields (e.g. 'string', 'number'). */
  type?: string;
}
