
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe, Layers, FileJson, Satellite, ArrowUpDown, Home, Settings } from 'lucide-react';
import { ConfigProvider } from '@/contexts/ConfigContext';
import { useConfigBuilderState } from '@/hooks/useConfigBuilderState';
import ServicesManager from './ServicesManager';
import LayersTab from './config/LayersTab';
import DrawOrderTab from './config/DrawOrderTab';
import PreviewTab from './config/PreviewTab';
import HomeTab from './config/HomeTab';
import SettingsTab from './config/SettingsTab';

// Error boundary component to catch context errors
class ConfigErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ConfigBuilder Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Configuration Error</h1>
            <p className="text-red-700 mb-4">
              There was an error loading the configuration builder.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

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

        <div className="w-full">
          <Tabs defaultValue="home" className="w-full">
            <TabsList className="grid w-full grid-cols-6 mb-6 bg-white border border-primary/20">
              <TabsTrigger value="home" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Home className="h-4 w-4" />
                Home
              </TabsTrigger>
              <TabsTrigger value="layers" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Layers className="h-4 w-4" />
                Layers
              </TabsTrigger>
              <TabsTrigger value="draworder" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <ArrowUpDown className="h-4 w-4" />
                Draw Order
              </TabsTrigger>
              <TabsTrigger value="services" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Globe className="h-4 w-4" />
                Services
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <FileJson className="h-4 w-4" />
                JSON Config
              </TabsTrigger>
            </TabsList>

            <TabsContent value="home">
              <HomeTab config={config} />
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

            <TabsContent value="services">
              <ServicesManager services={config.services} onAddService={addService} onRemoveService={removeService} />
            </TabsContent>

            <TabsContent value="settings">
              <SettingsTab config={config} />
            </TabsContent>

            <TabsContent value="preview">
              <PreviewTab config={config} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

const ConfigBuilder = () => {
  return (
    <ConfigErrorBoundary>
      <ConfigProvider>
        <ConfigBuilderContent />
      </ConfigProvider>
    </ConfigErrorBoundary>
  );
};

export default ConfigBuilder;
