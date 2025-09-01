
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SourceConfigType } from '@/types/config';
import { FORMAT_CONFIGS, S3_CONFIG } from '@/constants/formats';

interface FormatSelectorProps {
  selectedFormat: SourceConfigType;
  onFormatChange: (format: SourceConfigType) => void;
}

const FormatSelector = ({ selectedFormat, onFormatChange }: FormatSelectorProps) => {
  const handleFormatChange = (value: string) => {
    
    onFormatChange(value as SourceConfigType);
  };

  // Log current state
  

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Data Source Type</h3>
      <div className="space-y-2">
        <Label htmlFor="format">Format *</Label>
        <Select
          value={selectedFormat}
          onValueChange={handleFormatChange}
          name="format"
        >
          <SelectTrigger id="format">
            <SelectValue placeholder="Select format" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(FORMAT_CONFIGS).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
            <SelectItem value="s3">
              {S3_CONFIG.label}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default FormatSelector;
