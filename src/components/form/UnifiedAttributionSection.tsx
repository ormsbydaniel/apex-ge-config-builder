
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface UnifiedAttributionSectionProps {
  attributionText: string;
  attributionUrl: string;
  onUpdate: (field: string, value: string) => void;
  // Support both direct field updates and nested path updates
  fieldPrefix?: string;
}

const UnifiedAttributionSection = ({
  attributionText,
  attributionUrl,
  onUpdate,
  fieldPrefix = ''
}: UnifiedAttributionSectionProps) => {
  const getFieldName = (field: string) => fieldPrefix ? `${fieldPrefix}.${field}` : field;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Attribution</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="attributionText">Attribution Text</Label>
          <Input
            id="attributionText"
            name="attributionText"
            value={attributionText}
            onChange={(e) => onUpdate(getFieldName('attributionText'), e.target.value)}
            placeholder="Data provider name"
            autoComplete="off"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="attributionUrl">Attribution URL</Label>
          <Input
            id="attributionUrl"
            name="attributionUrl"
            value={attributionUrl || ''}
            onChange={(e) => onUpdate(getFieldName('attributionUrl'), e.target.value)}
            placeholder="https://example.com"
            autoComplete="url"
          />
        </div>
      </div>
    </div>
  );
};

export default UnifiedAttributionSection;
