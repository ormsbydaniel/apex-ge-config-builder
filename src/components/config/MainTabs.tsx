
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home, Layers, Layout, BarChart3, Eye } from 'lucide-react';
import HomeTab from '@/components/home/HomeTab';
import ServicesManager from '../ServicesManager';
import LayersTab from './LayersTab';
import LayoutTab from './LayoutTab';
import DrawOrderTab from './DrawOrderTab';
import PreviewTab from './PreviewTab';
import { useConfig } from '@/contexts/ConfigContext';
import { useExclusivitySets } from '@/hooks/useExclusivitySets';

const MainTabs = () => {
  const { config, dispatch } = useConfig();
  const { addExclusivitySet, removeExclusivitySet, newExclusivitySet, setNewExclusivitySet } = useExclusivitySets();

  // Layer management state
  const [showLayerForm, setShowLayerForm] = useState(false);
  const [selectedLayerType, setSelectedLayerType] = useState(null);
  const [editingLayerIndex, setEditingLayerIndex] = useState(null);
  const [defaultInterfaceGroup, setDefaultInterfaceGroup] = useState(undefined);

  const handleLayerTypeSelect = (type) => {
    setSelectedLayerType(type);
    setShowLayerForm(true);
  };

  const handleCancelLayerForm = () => {
    setShowLayerForm(false);
    setSelectedLayerType(null);
    setEditingLayerIndex(null);
    setDefaultInterfaceGroup(undefined);
  };

  const addLayer = (layer) => {
    dispatch({ type: 'ADD_SOURCE', payload: layer });
    handleCancelLayerForm();
  };

  const removeLayer = (index) => {
    dispatch({ type: 'REMOVE_SOURCE', payload: index });
  };

  const addService = (service) => {
    dispatch({ type: 'ADD_SERVICE', payload: service });
  };

  const updateLayer = (index, layer) => {
    const updatedSources = [...config.sources];
    updatedSources[index] = layer;
    dispatch({ type: 'UPDATE_SOURCES', payload: updatedSources });
    setEditingLayerIndex(null);
  };

  const moveLayer = (fromIndex, toIndex) => {
    const newSources = [...config.sources];
    const [movedLayer] = newSources.splice(fromIndex, 1);
    newSources.splice(toIndex, 0, movedLayer);
    dispatch({ type: 'UPDATE_SOURCES', payload: newSources });
  };

  const updateLayout = (field, value) => {
    dispatch({ type: 'UPDATE_LAYOUT', payload: { field, value } });
  };

  const updateInterfaceGroups = (groups) => {
    dispatch({ type: 'UPDATE_INTERFACE_GROUPS', payload: groups });
  };

  const updateConfig = (updates) => {
    if (updates.interfaceGroups) {
      dispatch({ type: 'UPDATE_INTERFACE_GROUPS', payload: updates.interfaceGroups });
    }
    if (updates.sources) {
      dispatch({ type: 'UPDATE_SOURCES', payload: updates.sources });
    }
  };

  return (
    <Tabs defaultValue="home" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="home" className="flex items-center gap-2">
          <Home className="h-4 w-4" />
          Home
        </TabsTrigger>
        <TabsTrigger value="layers" className="flex items-center gap-2">
          <Layers className="h-4 w-4" />
          Layers
        </TabsTrigger>
        <TabsTrigger value="layout" className="flex items-center gap-2">
          <Layout className="h-4 w-4" />
          Layout
        </TabsTrigger>
        <TabsTrigger value="draw-order" className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Draw Order
        </TabsTrigger>
        <TabsTrigger value="preview" className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Preview
        </TabsTrigger>
      </TabsList>

      <TabsContent value="home" className="mt-6">
        <HomeTab />
      </TabsContent>

      <TabsContent value="layers" className="mt-6">
        <div className="space-y-6">
          <ServicesManager
            services={config.services}
            onAddService={addService}
            onRemoveService={(index) => dispatch({ type: 'REMOVE_SERVICE', payload: index })}
          />
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
        </div>
      </TabsContent>

      <TabsContent value="layout" className="mt-6">
        <LayoutTab
          config={config}
          updateLayout={updateLayout}
          updateInterfaceGroups={updateInterfaceGroups}
          addExclusivitySet={addExclusivitySet}
          removeExclusivitySet={removeExclusivitySet}
          newExclusivitySet={newExclusivitySet}
          setNewExclusivitySet={setNewExclusivitySet}
        />
      </TabsContent>

      <TabsContent value="draw-order" className="mt-6">
        <DrawOrderTab
          config={config}
          updateConfig={updateConfig}
        />
      </TabsContent>

      <TabsContent value="preview" className="mt-6">
        <PreviewTab config={config} />
      </TabsContent>
    </Tabs>
  );
};

export default MainTabs;
