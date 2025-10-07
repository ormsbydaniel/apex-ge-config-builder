
import React, { useCallback, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useConfig } from '@/contexts/ConfigContext';
import { useConfigImport } from '@/hooks/useConfigImport';
import { useToast } from '@/hooks/use-toast';
import { useConfigSanitization } from '@/hooks/useConfigSanitization';
import { useJsonEditor } from '@/hooks/useJsonEditor';
import { useValidationErrors } from '@/hooks/useValidationErrors';
import { useEditorTheme } from '@/hooks/useEditorTheme';
import { Edit, AlertTriangle, FileText, Sun, Moon } from 'lucide-react';
import MonacoJsonEditor from './components/MonacoJsonEditor';
import JsonEditorToolbar from './components/JsonEditorToolbar';
import ValidationErrorDialog from './components/ValidationErrorDialog';
import JsonBreadcrumb from './components/JsonBreadcrumb';
import FindReplaceBar from './components/FindReplaceBar';

interface PreviewTabProps {
  config: any;
}

const PreviewTab = ({ config }: PreviewTabProps) => {
  const { dispatch } = useConfig();
  const { importConfig } = useConfigImport();
  const { toast } = useToast();
  
  const { configJson } = useConfigSanitization(config);
  
  const { editorTheme, toggleTheme } = useEditorTheme();
  const {
    isEditMode,
    editedJson,
    hasUnsavedChanges,
    showFindReplace,
    searchValue,
    replaceValue,
    handleEditModeToggle,
    handleJsonChange,
    handleReset,
    formatJson,
    toggleFindReplace,
    setSearchValue,
    setReplaceValue,
    handleFind,
    handleReplace,
    handleReplaceAll,
  } = useJsonEditor(configJson);
  
  const {
    showErrorDialog,
    validationErrors,
    jsonError,
    setShowErrorDialog,
    showErrors
  } = useValidationErrors();

  const [currentPath, setCurrentPath] = useState('');

  const handleApplyChanges = useCallback(async () => {
    try {
      const blob = new Blob([editedJson], { type: 'application/json' });
      const file = new File([blob], 'manual-edit.json', { type: 'application/json' });
      
      const result = await importConfig(file);
      
      if (result.success) {
        handleEditModeToggle();
        toast({
          title: "Configuration Updated",
          description: "Your manual changes have been applied successfully.",
        });
      } else {
        showErrors(result.errors || [], result.jsonError);
      }
    } catch (error) {
      console.error('Apply changes error:', error);
      toast({
        title: "Apply Failed",
        description: "An unexpected error occurred while applying changes.",
        variant: "destructive",
      });
    }
  }, [editedJson, importConfig, handleEditModeToggle, toast, showErrors]);

  const handleFormatJson = () => {
    const result = formatJson();
    if (result.success) {
      toast({
        title: "JSON Formatted",
        description: "The JSON has been properly formatted.",
      });
    } else {
      toast({
        title: "Format Failed",
        description: "Invalid JSON cannot be formatted.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-primary flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Configuration {isEditMode ? 'Editor' : 'Preview'}
            </span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4" />
                <Switch
                  checked={editorTheme === 'vs-dark'}
                  onCheckedChange={toggleTheme}
                />
                <Moon className="h-4 w-4" />
              </div>
              {isEditMode && hasUnsavedChanges && (
                <Badge variant="secondary" className="text-orange-700 bg-orange-100">
                  Unsaved Changes
                </Badge>
              )}
              <Button
                onClick={handleEditModeToggle}
                variant="outline"
                size="sm"
                className="border-primary/30"
              >
                <Edit className="h-4 w-4 mr-2" />
                {isEditMode ? 'Exit Edit' : 'Edit JSON'}
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            {isEditMode 
              ? "Manually edit your configuration JSON. Changes will be validated before applying."
              : "Review your configuration and export it as config.json (URLs are automatically sanitized)"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isEditMode ? (
              <>
                <JsonEditorToolbar
                  hasUnsavedChanges={hasUnsavedChanges}
                  onApplyChanges={handleApplyChanges}
                  onReset={handleReset}
                  onFormatJson={handleFormatJson}
                  onToggleFindReplace={toggleFindReplace}
                />

                {showFindReplace && (
                  <FindReplaceBar
                    searchValue={searchValue}
                    replaceValue={replaceValue}
                    onSearchChange={setSearchValue}
                    onReplaceChange={setReplaceValue}
                    onFind={handleFind}
                    onReplace={handleReplace}
                    onReplaceAll={handleReplaceAll}
                    onClose={toggleFindReplace}
                  />
                )}

                {currentPath && (
                  <JsonBreadcrumb path={currentPath} />
                )}
                
                <MonacoJsonEditor
                  value={editedJson}
                  onChange={handleJsonChange}
                  theme={editorTheme}
                  onCursorPositionChange={setCurrentPath}
                  searchQuery={searchValue}
                />
                
                {hasUnsavedChanges && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      You have unsaved changes. Click "Apply Changes" to validate and save your modifications.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            ) : (
              <MonacoJsonEditor
                value={configJson}
                readOnly
                theme={editorTheme}
              />
            )}
          </div>
        </CardContent>
      </Card>

      <ValidationErrorDialog
        open={showErrorDialog}
        onOpenChange={setShowErrorDialog}
        errors={validationErrors}
        jsonError={jsonError}
      />
    </>
  );
};

export default PreviewTab;
