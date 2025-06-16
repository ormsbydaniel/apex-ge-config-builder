
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataSourceFormat } from '@/types/config';
import { FORMAT_CONFIGS } from '@/constants/formats';

interface FormatSelectorProps {
  selectedFormat: DataSourceFormat;
  onFormatChange: (format: DataSourceFormat) => void;
}

const FormatSelector = ({ selectedFormat, onFormatChange }: FormatSelectorProps) => {
  const handleFormatChange = (value: string) => {
    console.log('=== FormatSelector Debug ===');
    console.log('Format changed from:', selectedFormat);
    console.log('Format changed to:', value);
    console.log('Value type:', typeof value);
    console.log('Available formats:', Object.keys(FORMAT_CONFIGS));
    console.log('===========================');
    
    onFormatChange(value as DataSourceFormat);
  };

  // Log current state
  console.log('FormatSelector render - selectedFormat:', selectedFormat);

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
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default FormatSelector;
