
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Save, X, FileJson } from 'lucide-react';
import { DataSource } from '@/types/config';
import { useJsonEditor } from '@/hooks/useJsonEditor';
import { useToast } from '@/hooks/use-toast';
import MonacoJsonEditor from '@/components/config/components/MonacoJsonEditor';
import JsonEditorToolbar from '@/components/config/components/JsonEditorToolbar';

interface LayerJsonEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  layer: DataSource;
  onSave: (updatedLayer: DataSource) => void;
}

const LayerJsonEditorDialog = ({ isOpen, onClose, layer, onSave }: LayerJsonEditorDialogProps) => {
  const { toast } = useToast();
  const layerJson = JSON.stringify(layer, null, 2);
  
  const {
    isEditMode,
    editedJson,
    hasUnsavedChanges,
    handleEditModeToggle,
    handleJsonChange,
    handleReset,
    formatJson
  } = useJsonEditor(layerJson);

  const handleApplyChanges = () => {
    try {
      const parsedLayer = JSON.parse(editedJson);
      
      // Basic validation to ensure it's still a valid DataSource structure
      if (!parsedLayer.name || !parsedLayer.data) {
        throw new Error('Invalid layer structure: missing required fields (name, data)');
      }
      
      onSave(parsedLayer);
      toast({
        title: "Layer Updated",
        description: `Layer "${parsedLayer.name}" has been updated successfully.`,
      });
      onClose();
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: error instanceof Error ? error.message : "Please check your JSON syntax and try again.",
        variant: "destructive"
      });
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      const confirmDiscard = window.confirm('You have unsaved changes. Are you sure you want to close without saving?');
      if (!confirmDiscard) return;
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5" />
            Edit Layer JSON: {layer.name}
          </DialogTitle>
          <DialogDescription>
            Edit the JSON configuration for this layer. Changes will be applied to your configuration when saved.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto max-h-[calc(80vh-180px)]">
          {!isEditMode ? (
            <div className="space-y-4 pb-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Read-only view</span>
                <Button onClick={handleEditModeToggle} variant="outline">
                  Enable Editing
                </Button>
              </div>
              <MonacoJsonEditor
                value={layerJson}
                readOnly={true}
                height="500px"
              />
            </div>
          ) : (
            <div className="space-y-4 pb-6">
              <JsonEditorToolbar
                hasUnsavedChanges={hasUnsavedChanges}
                onApplyChanges={handleApplyChanges}
                onReset={handleReset}
                onFormatJson={formatJson}
              />
              <MonacoJsonEditor
                value={editedJson}
                onChange={handleJsonChange}
                readOnly={false}
                height="450px"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
          {isEditMode && (
            <Button onClick={handleApplyChanges} disabled={!hasUnsavedChanges}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LayerJsonEditorDialog;
