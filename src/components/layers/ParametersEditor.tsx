import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';

export interface ParameterRow {
  key: string;
  value: string;
}

interface ParametersEditorProps {
  rows: ParameterRow[];
  onChange: (rows: ParameterRow[]) => void;
}

// Keys managed by the viewer / OGC protocol — disallow user overrides.
const RESERVED_KEYS = ['time', 'layers', 'service', 'version', 'request'];

const isReserved = (key: string): boolean =>
  RESERVED_KEYS.includes(key.trim().toLowerCase());

export const rowsToRecord = (rows: ParameterRow[]): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const { key, value } of rows) {
    const k = key.trim();
    if (!k || isReserved(k)) continue;
    out[k] = value;
  }
  return out;
};

export const recordToRows = (
  record?: Record<string, unknown>
): ParameterRow[] => {
  if (!record) return [];
  return Object.entries(record)
    .filter(([key]) => !isReserved(key))
    .map(([key, value]) => ({
      key,
      value: value == null ? '' : String(value),
    }));
};

export const mergeWmsParameters = (
  rows: ParameterRow[],
  serviceVersion?: string,
): Record<string, string> => ({
  ...rowsToRecord(rows),
  ...(serviceVersion ? { version: serviceVersion } : {}),
});

export const applyOgcServiceVersion = (
  item: Record<string, unknown>,
  format: string,
  rows: ParameterRow[],
  serviceVersion?: string,
): Record<string, unknown> => {
  const next = { ...item };

  if (format === 'wms') {
    const parameters = mergeWmsParameters(rows, serviceVersion);
    if (Object.keys(parameters).length > 0) {
      next.parameters = parameters;
    } else {
      delete next.parameters;
    }
    delete next.version;
    return next;
  }

  delete next.parameters;
  if (format === 'wmts' && serviceVersion) {
    next.version = serviceVersion;
  } else {
    delete next.version;
  }

  return next;
};

const ParametersEditor: React.FC<ParametersEditorProps> = ({ rows, onChange }) => {
  const update = (index: number, patch: Partial<ParameterRow>) => {
    const next = rows.map((r, i) => (i === index ? { ...r, ...patch } : r));
    onChange(next);
  };

  const remove = (index: number) => {
    onChange(rows.filter((_, i) => i !== index));
  };

  const add = () => {
    onChange([...rows, { key: '', value: '' }]);
  };

  return (
    <div className="space-y-2">
      <Label>Parameters</Label>
      <p className="text-xs text-muted-foreground">
        Optional key/value pairs appended to WMS requests (e.g. <code>token</code>,{' '}
        <code>styles</code>). Reserved keys ({RESERVED_KEYS.join(', ')}) are managed
        automatically and cannot be set here.
      </p>

      {rows.length > 0 && (
        <div className="space-y-2">
          {rows.map((row, index) => {
            const reserved = row.key.trim() !== '' && isReserved(row.key);
            return (
              <div key={index} className="flex gap-2 items-start">
                <div className="flex-1">
                  <Input
                    placeholder="Key"
                    value={row.key}
                    onChange={(e) => update(index, { key: e.target.value })}
                    aria-invalid={reserved}
                    className={reserved ? 'border-destructive' : undefined}
                  />
                  {reserved && (
                    <p className="text-xs text-destructive mt-1">
                      "{row.key}" is reserved and will be ignored.
                    </p>
                  )}
                </div>
                <Input
                  placeholder="Value"
                  value={row.value}
                  onChange={(e) => update(index, { value: e.target.value })}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  aria-label="Remove parameter"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="h-4 w-4 mr-2" />
        Add parameter
      </Button>
    </div>
  );
};

export default ParametersEditor;
