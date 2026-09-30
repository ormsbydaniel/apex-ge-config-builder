import type { FieldsConfig } from '@/types/category';

/** Explicit display order wins over JSON key order; ties retain their input order. */
export function orderedFieldNames(fields: FieldsConfig): string[] {
  return Object.keys(fields).sort((a, b) => {
    const aOrder = fields[a]?.order;
    const bOrder = fields[b]?.order;
    return (aOrder ?? Infinity) - (bOrder ?? Infinity);
  });
}

/** Assign sequential display positions to visible fields without changing hidden nulls. */
export function assignFieldOrder(fields: FieldsConfig, names: string[]): FieldsConfig {
  let order = 0;
  return Object.fromEntries(names.map(name => {
    const config = fields[name];
    return [name, config === null ? null : { ...config, order: ++order }];
  }));
}