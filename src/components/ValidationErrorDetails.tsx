
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, XCircle, Settings, Globe, Map, Info, FileText } from 'lucide-react';
import { ValidationErrorDetails } from '@/types/config';
import { categorizeErrors } from '@/utils/validationUtils';

interface ValidationErrorDetailsProps {
  errors: ValidationErrorDetails[];
  fileName?: string;
  jsonError?: any;
}

const ValidationErrorDetailsComponent = ({ errors, fileName, jsonError }: ValidationErrorDetailsProps) => {
  const categorizedErrors = categorizeErrors(errors);
  
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'layout': return <Settings className="h-4 w-4" />;
      case 'services': return <Globe className="h-4 w-4" />;
      case 'sources': return <Map className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'layout': return 'Layout Configuration';
      case 'services': return 'Services Configuration';
      case 'sources': return 'Data Sources Configuration';
      default: return 'General Configuration';
    }
  };

  const renderJSONError = () => {
    if (!jsonError) return null;

    return (
      <Card className="border-red-200 mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-red-700 flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            JSON Parse Error
            <Badge variant="destructive" className="ml-auto">
              Syntax Error
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="border-l-2 border-red-300 pl-3">
            <div className="flex items-start gap-2">
              <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-red-800 text-sm">
                  {jsonError.lineNumber ? `Line ${jsonError.lineNumber}${jsonError.columnNumber ? `, Column ${jsonError.columnNumber}` : ''}` : 'JSON Syntax Error'}
                </p>
                <p className="text-red-600 text-sm">{jsonError.message}</p>
                {jsonError.position && (
                  <p className="text-xs text-red-500 mt-1 font-mono">
                    Character position: {jsonError.position}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderErrorCategory = (category: string, categoryErrors: ValidationErrorDetails[]) => {
    if (categoryErrors.length === 0) return null;

    return (
      <Card key={category} className="border-red-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-red-700 flex items-center gap-2 text-base">
            {getCategoryIcon(category)}
            {getCategoryTitle(category)}
            <Badge variant="destructive" className="ml-auto">
              {categoryErrors.length} error{categoryErrors.length !== 1 ? 's' : ''}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {categoryErrors.map((error, index) => (
              <div key={index} className="border-l-2 border-red-300 pl-3">
                <div className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-red-800 text-sm">{error.field}</p>
                    <p className="text-red-600 text-sm">{error.message}</p>
                    {error.path.length > 0 && (
                      <p className="text-xs text-red-500 mt-1 font-mono">
                        Configuration path: {error.path.join(' → ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const totalErrors = errors.length + (jsonError ? 1 : 0);

  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Configuration Validation Failed</AlertTitle>
        <AlertDescription>
          The configuration file {fileName ? `"${fileName}" ` : ''}contains {totalErrors} error{totalErrors !== 1 ? 's' : ''} that must be fixed before it can be loaded.
        </AlertDescription>
      </Alert>

      {renderJSONError()}

      <div className="space-y-4">
        {Object.entries(categorizedErrors).map(([category, categoryErrors]) =>
          renderErrorCategory(category, categoryErrors)
        )}
      </div>

      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">How to fix these errors:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Check JSON syntax if there are parse errors (missing commas, brackets, quotes)</li>
                <li>Ensure all required fields are present and not empty</li>
                <li>Verify that URLs are properly formatted (include http:// or https://)</li>
                <li>Check that arrays contain the expected data types</li>
                <li>Ensure service IDs are unique and properly referenced</li>
                <li>Validate that interface groups exist before assigning sources to them</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ValidationErrorDetailsComponent;
