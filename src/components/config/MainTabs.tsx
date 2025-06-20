
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home, Globe, Layers, Settings, FileText, Eye } from 'lucide-react';
import HomeTab from './HomeTab';
import { ServicesManager } from '../ServicesManager';
import LayersTab from './LayersTab';
import LayoutTab from './LayoutTab';
import DrawOrderTab from './DrawOrderTab';
import PreviewTab from './PreviewTab';

interface MainTabsProps {
  defaultTab?: string;
}

const MainTabs = ({ defaultTab = "home" }: MainTabsProps) => {
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
        <ServicesManager />
      </TabsContent>
      
      <TabsContent value="layers" className="flex-1 mt-6">
        <LayersTab />
      </TabsContent>
      
      <TabsContent value="layout" className="flex-1 mt-6">
        <LayoutTab />
      </TabsContent>
      
      <TabsContent value="draw-order" className="flex-1 mt-6">
        <DrawOrderTab />
      </TabsContent>
      
      <TabsContent value="preview" className="flex-1 mt-6">
        <PreviewTab />
      </TabsContent>
    </Tabs>
  );
};

export default MainTabs;
