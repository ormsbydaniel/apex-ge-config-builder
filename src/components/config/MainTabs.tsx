
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home, Globe, Layers, Settings, FileText, Eye } from 'lucide-react';
import { useConfig } from '@/contexts/ConfigContext';
import { useExclusivitySets } from '@/hooks/useExclusivitySets';
import HomeTab from './HomeTab';
import ServicesManager from '../ServicesManager';
import LayersTab from './LayersTab';
import LayoutTab from './LayoutTab';
import DrawOrderTab from './DrawOrderTab';
import PreviewTab from './PreviewTab';

interface MainTabsProps {
  defaultTab?: string;
}

const MainTabs = ({ defaultTab = "home" }: MainTabsProps) => {
  const { config, dispatch } = useConfig();

  // Use the exclusivity sets hook
  const {
    newExclusivitySet,
    setNewExclusivitySet,
    addExclusivitySet,
    removeExclusivitySet
  } = useExclusivitySets({ config, dispatch });

  // Services management handlers
  const handleAddService = (service: any) => {
    dispatch({ type: 'ADD_SERVICE', payload: service });
  };

  const handleRemoveService = (index: number) => {
    dispatch({ type: 'REMOVE_SERVICE', payload: index });
  };

  // Layout management handlers  
  const updateLayout = (field: string, value: string) => {
    dispatch({
      type: 'UPDATE_LAYOUT',
      payload: { field, value }
    });
  };

  const updateInterfaceGroups = (interfaceGroups: string[]) => {
    dispatch({ type: 'UPDATE_INTERFACE_GROUPS', payload: interfaceGroups });
  };

  const updateConfig = (updates: any) => {
    if (updates.sources) {
      dispatch({ type: 'UPDATE_SOURCES', payload: updates.sources });
    }
    if (updates.interfaceGroups) {
      dispatch({ type: 'UPDATE_INTERFACE_GROUPS', payload: updates.interfaceGroups });
    }
  };

  return (
    <Tabs defaultValue={defaultTab} className="w-full h-full">
      <TabsList className="grid w-full grid-cols-6">
        <TabsTrigger value="home" className="flex items-center gap-2">
          <Home className="h-4 w-4" />
          Home
        </TabsTrigger>
        <TabsTrigger value="services" className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Services
        </TabsTrigger>
        <TabsTrigger value="layers" className="flex items-center gap-2">
          <Layers className="h-4 w-4" />
          Layers
        </TabsTrigger>
        <TabsTrigger value="layout" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Layout
        </TabsTrigger>
        <TabsTrigger value="draw-order" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Draw Order
        </TabsTrigger>
        <TabsTrigger value="preview" className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Preview
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="home" className="flex-1 mt-6">
        <HomeTab />
      </TabsContent>
      
      <TabsContent value="services" className="flex-1 mt-6">
        <ServicesManager 
          services={config.services}
          onAddService={handleAddService}
          onRemoveService={handleRemoveService}
        />
      </TabsContent>
      
      <TabsContent value="layers" className="flex-1 mt-6">
        <LayersTab
          config={config}
          showLayerForm={false}
          selectedLayerType={null}
          setShowLayerForm={() => {}}
          setSelectedLayerType={() => {}}
          setDefaultInterfaceGroup={() => {}}
          handleLayerTypeSelect={() => {}}
          handleCancelLayerForm={() => {}}
          addLayer={() => {}}
          removeLayer={() => {}}
          addService={handleAddService}
          updateLayer={() => {}}
          editingLayerIndex={null}
          setEditingLayerIndex={() => {}}
          moveLayer={() => {}}
          updateConfig={updateConfig}
          addExclusivitySet={addExclusivitySet}
          removeExclusivitySet={removeExclusivitySet}
          newExclusivitySet={newExclusivitySet}
          setNewExclusivitySet={setNewExclusivitySet}
        />
      </TabsContent>
      
      <TabsContent value="layout" className="flex-1 mt-6">
        <LayoutTab
          config={config}
          updateLayout={updateLayout}
          updateInterfaceGroups={updateInterfaceGroups}
          addExclusivitySet={addExclusivitySet}
          removeExclusivitySet={removeExclusivitySet}
          newExclusivitySet={newExclusivitySet}
          setNewExclusivitySet={setNewExclusivitySet}
          updateConfig={updateConfig}
        />
      </TabsContent>
      
      <TabsContent value="draw-order" className="flex-1 mt-6">
        <DrawOrderTab
          config={{ sources: config.sources, exclusivitySets: config.exclusivitySets }}
          updateConfig={updateConfig}
        />
      </TabsContent>
      
      <TabsContent value="preview" className="flex-1 mt-6">
        <PreviewTab config={config} />
      </TabsContent>
    </Tabs>
  );
};

export default MainTabs;
