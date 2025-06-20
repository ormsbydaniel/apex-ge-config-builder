
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe, Layers, FileJson, Satellite, ArrowUpDown } from 'lucide-react';
import { ConfigProvider } from '@/contexts/ConfigContext';
import { useConfigBuilderState } from '@/hooks/useConfigBuilderState';
import ServicesManager from './ServicesManager';
import LayersTab from './config/LayersTab';
import DrawOrderTab from './config/DrawOrderTab';
import PreviewTab from './config/PreviewTab';
import ConfigSummary from './config/ConfigSummary';

const ConfigBuilderContent = () => {
  const {
    config,
    newExclusivitySet,
    setNewExclusivitySet,
    showLayerForm,
    setShowLayerForm,
    selectedLayerType,
    setSelectedLayerType,
    editingLayerIndex,
    setEditingLayerIndex,
    defaultInterfaceGroup,
    setDefaultInterfaceGroup,
    updateLayout,
    updateInterfaceGroups,
    addExclusivitySet,
    removeExclusivitySet,
    addService,
    removeService,
    addLayer,
    removeLayer,
    updateLayer,
    moveLayer,
    handleLayerTypeSelect,
    handleCancelLayerForm,
    updateConfig
  } = useConfigBuilderState();

  return (
    <div className="min-h-screen" style={{
      backgroundColor: '#043346'
    }}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 bg-clip-text mb-2 flex items-center gap-3 text-slate-50">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg">
              <Satellite className="h-8 w-8 text-white" />
            </div>
            ESA APEx Geospatial Explorer
          </h1>
          <p className="text-xl text-slate-100 font-medium">Configuration Builder</p>
          <p className="text-slate-200 mt-1">Build and manage your interactive mapping application configuration</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Tabs defaultValue="services" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6 bg-white border border-primary/20">
                <TabsTrigger value="services" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Globe className="h-4 w-4" />
                  Services
                </TabsTrigger>
                <TabsTrigger value="layers" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Layers className="h-4 w-4" />
                  Layers
                </TabsTrigger>
                <TabsTrigger value="draworder" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <ArrowUpDown className="h-4 w-4" />
                  Draw Order
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <FileJson className="h-4 w-4" />
                  JSON Config
                </TabsTrigger>
              </TabsList>

              <TabsContent value="services">
                <ServicesManager services={config.services} onAddService={addService} onRemoveService={removeService} />
              </TabsContent>

              <TabsContent value="layers">
                <LayersTab 
                  config={config} 
                  showLayerForm={showLayerForm} 
                  selectedLayerType={selectedLayerType} 
                  defaultInterfaceGroup={defaultInterfaceGroup}
                  setShowLayerForm={setShowLayerForm} 
                  setSelectedLayerType={setSelectedLayerType} 
                  setDefaultInterfaceGroup={setDefaultInterfaceGroup}
                  handleLayerTypeSelect={handleLayerTypeSelect} 
                  handleCancelLayerForm={handleCancelLayerForm} 
                  addLayer={addLayer} 
                  removeLayer={removeLayer} 
                  addService={addService} 
                  updateLayer={updateLayer} 
                  editingLayerIndex={editingLayerIndex} 
                  setEditingLayerIndex={setEditingLayerIndex} 
                  moveLayer={moveLayer}
                  updateConfig={updateConfig}
                  addExclusivitySet={addExclusivitySet}
                  removeExclusivitySet={removeExclusivitySet}
                  newExclusivitySet={newExclusivitySet}
                  setNewExclusivitySet={setNewExclusivitySet}
                />
              </TabsContent>

              <TabsContent value="draworder">
                <DrawOrderTab 
                  config={{
                    sources: config.sources,
                    exclusivitySets: config.exclusivitySets || []
                  }} 
                  updateConfig={updateConfig}
                />
              </TabsContent>

              <TabsContent value="preview">
                <PreviewTab config={config} />
              </TabsContent>
            </Tabs>
          </div>

          <div className="lg:col-span-1">
            <ConfigSummary config={config} />
          </div>
        </div>
      </div>
    </div>
  );
};

const ConfigBuilder = () => {
  return (
    <ConfigProvider>
      <ConfigBuilderContent />
    </ConfigProvider>
  );
};

export default ConfigBuilder;
