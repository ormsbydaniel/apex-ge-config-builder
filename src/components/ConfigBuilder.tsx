
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Globe, Layers, FileJson, Satellite, ArrowUpDown, Home, Settings, Map, Download, BookOpen, Workflow as WorkflowIcon } from 'lucide-react';
import AppSettingsDialog from './app-settings/AppSettingsDialog';
import { useAppSettings } from '@/hooks/useAppSettings';
import { Button } from '@/components/ui/button';
import { useConfigExport } from '@/hooks/useConfigIO';
import { ConfigProvider, useConfig } from '@/contexts/ConfigContext';
import { useConfigBuilderState } from '@/hooks/useConfigBuilderState';
import { useNavigationState } from '@/hooks/useNavigationState';
import { useScrollToLayer } from '@/hooks/useScrollToLayer';
import ServicesManager from './ServicesManager';
import LayersTab from './config/LayersTab';
import DrawOrderTab from './config/DrawOrderTab';
import PreviewTab from './config/PreviewTab';
import HomeTab from './config/HomeTab';
import SettingsTab from './config/SettingsTab';
import WorkflowsTab from './config/workflows/WorkflowsTab';
import StorymapsTab from './config/StorymapsTab';
import DonorConfigPickerDialog from './layers/import/DonorConfigPickerDialog';


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
  const [appSettingsOpen, setAppSettingsOpen] = React.useState(false);
  const { settings: appSettings } = useAppSettings();
  const navigate = useNavigate();
  const { config: configState } = useConfig();
  const { exportConfig } = useConfigExport();
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
    defaultSubinterfaceGroup,
    setDefaultSubinterfaceGroup,
    updateLayout,
    updateInterfaceGroups,
    addExclusivitySet,
    removeExclusivitySet,
    addService,
    removeService,
    updateService,
    addLayer,
    removeLayer,
    updateLayer,
    moveLayer,
    handleLayerTypeSelect,
    handleCancelLayerForm,
    handleImportLayer,
    handleApplyDonorImport,
    donorPickerOpen,
    setDonorPickerOpen,
    importTargetGroup,
    importTargetSubGroup,
    updateConfig,
    addWorkflow,
    updateWorkflow,
    removeWorkflow,
    duplicateWorkflow,
    moveWorkflow,
  } = useConfigBuilderState();


  // Track navigation state for Preview transitions
  const { navigationState, setActiveTab, setExpandedLayers, setExpandedGroups, setExpandedSubGroups, setScrollPosition } = useNavigationState();
  const { scrollToLayer } = useScrollToLayer();
  const layersScrollRef = React.useRef<HTMLDivElement>(null);

  const handleNavigateToLayer = React.useCallback((sourceIndex: number) => {
    const cardId = `layer-${sourceIndex}`;
    const source = config?.sources?.[sourceIndex];
    const interfaceGroup: string | undefined = source?.layout?.interfaceGroup;
    const subinterfaceGroup: string | undefined = source?.layout?.subinterfaceGroup;

    // Pre-seed all three expansion levels so LayerHierarchy restores them on mount.
    const currentLayers = navigationState.expandedLayers || [];
    if (!currentLayers.includes(cardId)) {
      setExpandedLayers([...currentLayers, cardId]);
    }

    // Interface group (or special bucket for ungrouped / base layers).
    const isBaseLayer = (source as { isBaseLayer?: boolean })?.isBaseLayer === true;
    const groupKey = interfaceGroup
      ? interfaceGroup
      : isBaseLayer
        ? '__BASE_LAYERS__'
        : '__UNGROUPED__';
    const currentGroups = navigationState.expandedGroups || [];
    if (!currentGroups.includes(groupKey)) {
      setExpandedGroups([...currentGroups, groupKey]);
    }

    // Sub-interface group (only if present and within a real interface group).
    if (interfaceGroup && subinterfaceGroup) {
      const subKey = `${interfaceGroup}::${subinterfaceGroup}`;
      const currentSubs = navigationState.expandedSubGroups || [];
      if (!currentSubs.includes(subKey)) {
        setExpandedSubGroups([...currentSubs, subKey]);
      }
    }

    setActiveTab('layers');
    scrollToLayer(sourceIndex, cardId);
  }, [
    config,
    navigationState.expandedLayers,
    navigationState.expandedGroups,
    navigationState.expandedSubGroups,
    setExpandedLayers,
    setExpandedGroups,
    setExpandedSubGroups,
    setActiveTab,
    scrollToLayer,
  ]);

  const handleTabChange = (value: string) => {
    // Save scroll position before changing tabs
    if (navigationState.activeTab === 'layers' && layersScrollRef.current) {
      setScrollPosition(layersScrollRef.current.scrollTop);
    }
    
    // Don't save state for preview navigation (handled separately)
    if (value !== 'mappreview') {
      setActiveTab(value);
    }
  };

  const handlePreviewClick = () => {
    // Save current scroll position before navigating
    if (navigationState.activeTab === 'layers' && layersScrollRef.current) {
      setScrollPosition(layersScrollRef.current.scrollTop);
    }
    // Save current tab state before navigating
    navigate('/preview');
  };
  
  // Save expanded layers state (simplified - will be managed by LayerHierarchy)
  const handleExpansionStateChange = React.useCallback((layers: string[], groups: string[], subGroups?: string[]) => {
    setExpandedLayers(layers);
    setExpandedGroups(groups);
    if (subGroups) {
      setExpandedSubGroups(subGroups);
    }
  }, [setExpandedLayers, setExpandedGroups, setExpandedSubGroups]);

  // Restore scroll position when returning to layers tab
  React.useEffect(() => {
    if (navigationState.activeTab === 'layers' && layersScrollRef.current && navigationState.scrollPosition > 0) {
      // Small delay to allow content to render
      setTimeout(() => {
        if (layersScrollRef.current) {
          layersScrollRef.current.scrollTop = navigationState.scrollPosition;
        }
      }, 100);
    }
  }, [navigationState.activeTab, navigationState.scrollPosition]);

  // If user disables a tab while it's active, fall back to Home.
  React.useEffect(() => {
    if (navigationState.activeTab === 'workflows' && !appSettings.showAlgorithmsTab) {
      setActiveTab('home');
    } else if (navigationState.activeTab === 'storymaps' && !appSettings.showStorymapsTab) {
      setActiveTab('home');
    }
  }, [appSettings.showAlgorithmsTab, appSettings.showStorymapsTab, navigationState.activeTab, setActiveTab]);

  const visibleTabCount = 7 + (appSettings.showAlgorithmsTab ? 1 : 0) + (appSettings.showStorymapsTab ? 1 : 0);
  // Explicit map so Tailwind JIT picks up the class names.
  const gridColsByCount: Record<number, string> = {
    7: 'grid-cols-7',
    8: 'grid-cols-8',
    9: 'grid-cols-9',
  };
  const gridColsClass = `grid w-full ${gridColsByCount[visibleTabCount]} bg-white border border-primary/20 mb-6`;

  return (
    <div className="min-h-screen" style={{
      backgroundColor: '#043346'
    }}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 bg-clip-text mb-2 flex items-center gap-3 text-slate-50">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg">
                <Satellite className="h-8 w-8 text-white" />
              </div>
              ESA APEx Geospatial Explorer
            </h1>
            <p className="text-xl text-slate-100 font-medium">Configuration Builder</p>
            <p className="text-slate-200 mt-1">Build and manage your interactive mapping application configuration</p>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setAppSettingsOpen(true)}
              aria-label="Application settings"
              title="Application settings"
              className="p-1 rounded text-white/40 hover:text-white/80 transition-colors"
            >
              <Settings className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1 bg-white/5 backdrop-blur-sm p-1.5 rounded-xl border border-white/10">
              <a
                href="/guide/index.html"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-all group"
              >
                <BookOpen className="h-5 w-5 opacity-80 group-hover:opacity-100" />
                <span className="text-xs font-semibold tracking-wide uppercase">User Guide</span>
              </a>

              <div className="w-px h-6 bg-white/10 mx-1" />

              <button
                type="button"
                onClick={() => exportConfig()}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-all group cursor-pointer"
              >
                <Download className="h-5 w-5 opacity-80 group-hover:opacity-100" />
                <span className="text-xs font-semibold tracking-wide uppercase">Export</span>
              </button>
            </div>
          </div>

        </div>

        <div className="w-full">
          <Tabs 
            value={navigationState.activeTab} 
            onValueChange={handleTabChange} 
            className="w-full"
          >
            <TabsList className={gridColsClass}>
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
              {appSettings.showAlgorithmsTab && (
                <TabsTrigger value="workflows" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <WorkflowIcon className="h-4 w-4" />
                  Algorithms
                </TabsTrigger>
              )}
              {appSettings.showStorymapsTab && (
                <TabsTrigger value="storymaps" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <BookOpen className="h-4 w-4" />
                  Storymaps
                </TabsTrigger>
              )}
              <TabsTrigger value="services" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Globe className="h-4 w-4" />
                Services
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="jsonconfig" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <FileJson className="h-4 w-4" />
                JSON Config
              </TabsTrigger>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild={false} className="inline-block">
                    <span>
                      <TabsTrigger
                        value="mappreview"
                        className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                        onClick={handlePreviewClick}
                        disabled={configState.hasUnsavedFormChanges}
                      >
                        <Map className="h-4 w-4" />
                        Preview
                      </TabsTrigger>
                    </span>
                  </TooltipTrigger>
                  {configState.hasUnsavedFormChanges && (
                    <TooltipContent>
                      <p>Please Save or Cancel changes to the {configState.unsavedFormDescription} before previewing</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </TabsList>


            <TabsContent value="home">
              <HomeTab config={config} onNavigateToLayer={handleNavigateToLayer} />
            </TabsContent>

            <TabsContent value="layers">
              <div ref={layersScrollRef}>
                <LayersTab
                  config={config} 
                  showLayerForm={showLayerForm} 
                  selectedLayerType={selectedLayerType} 
                  defaultInterfaceGroup={defaultInterfaceGroup}
                  defaultSubinterfaceGroup={defaultSubinterfaceGroup}
                  setShowLayerForm={setShowLayerForm} 
                  setSelectedLayerType={setSelectedLayerType} 
                  setDefaultInterfaceGroup={setDefaultInterfaceGroup}
                  setDefaultSubinterfaceGroup={setDefaultSubinterfaceGroup}
                  handleLayerTypeSelect={handleLayerTypeSelect}
                  onImportLayer={handleImportLayer}
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
                navigationState={navigationState}
                onExpansionStateChange={handleExpansionStateChange}
              />
              </div>
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

            {appSettings.showAlgorithmsTab && (
              <TabsContent value="workflows">
                <WorkflowsTab
                  workflows={(config as any).workflows ?? []}
                  services={config.services}
                  addWorkflow={addWorkflow}
                  updateWorkflow={updateWorkflow}
                  removeWorkflow={removeWorkflow}
                  duplicateWorkflow={duplicateWorkflow}
                  moveWorkflow={moveWorkflow}
                />
              </TabsContent>
            )}

            {appSettings.showStorymapsTab && (
              <TabsContent value="storymaps">
                <StorymapsTab />
              </TabsContent>
            )}


            <TabsContent value="services">
              <ServicesManager
                services={config.services}
                onAddService={addService}
                onRemoveService={removeService}
                onUpdateService={updateService}
                isActive={navigationState.activeTab === 'services'}
              />
            </TabsContent>

            <TabsContent value="settings">
              <SettingsTab config={config} />
            </TabsContent>

            <TabsContent value="jsonconfig">
              <PreviewTab config={config} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <DonorConfigPickerDialog
        open={donorPickerOpen}
        onOpenChange={setDonorPickerOpen}
        targetInterfaceGroup={importTargetGroup}
        targetSubinterfaceGroup={importTargetSubGroup}
        onImport={handleApplyDonorImport}
      />

      <AppSettingsDialog open={appSettingsOpen} onOpenChange={setAppSettingsOpen} />
    </div>
  );
};

const ConfigBuilder = () => {
  return (
    <ConfigErrorBoundary>
      <ConfigBuilderContent />
    </ConfigErrorBoundary>
  );
};

export default ConfigBuilder;
