import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Upload } from 'lucide-react';
import { Category } from '@/types/config';
import {
  CategoryCsvParseResult,
  downloadCategoriesCsv,
  parseCategoriesCsv,
} from '@/utils/categoryCsv';

interface CategoryCsvActionsProps {
  categories: Category[];
  useValues: boolean;
  filenameBase: string;
  onImport: (result: CategoryCsvParseResult) => void;
}

const sanitiseFilename = (name: string): string =>
  (name || 'categories').replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '') || 'categories';

const CategoryCsvActions = ({
  categories,
  useValues,
  filenameBase,
  onImport,
}: CategoryCsvActionsProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    downloadCategoriesCsv(
      categories,
      useValues,
      `${sanitiseFilename(filenameBase)}-categories.csv`,
    );
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const result = parseCategoriesCsv(text);
    onImport(result);
    // Allow re-importing the same file
    e.target.value = '';
  };

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={handleImportClick}>
        <Upload className="h-4 w-4 mr-2" />
        Import CSV
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleExport}
        disabled={categories.length === 0}
      >
        <Download className="h-4 w-4 mr-2" />
        Export CSV
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleFileChange}
      />
    </>
  );
};

export default CategoryCsvActions;
