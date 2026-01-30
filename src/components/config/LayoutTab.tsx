
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import InterfaceGroupManager from '../InterfaceGroupManager';
import DesignVariantEditor from './DesignVariantEditor';
import { DataSource, Service } from '@/types/config';
import { DesignConfig } from '@/types/format';

interface LayoutTabProps {
  config: any;
  updateLayout: (field: string, value: string) => void;
  updateDesign: (design: DesignConfig | undefined) => void;
  updateInterfaceGroups: (interfaceGroups: string[]) => void;
  addExclusivitySet: () => void;
  removeExclusivitySet: (index: number) => void;
  newExclusivitySet: string;
  setNewExclusivitySet: (value: string) => void;
  updateConfig: (updates: { interfaceGroups?: string[]; sources?: DataSource[]; services?: Service[] }) => void;
}

const LayoutTab = ({
  config,
  updateLayout,
  updateDesign,
  updateInterfaceGroups,
  addExclusivitySet,
  removeExclusivitySet,
  newExclusivitySet,
  setNewExclusivitySet,
  updateConfig
}: LayoutTabProps) => {
  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-primary">Layout Configuration</CardTitle>
          <CardDescription>
            Configure the basic layout and navigation settings for your geospatial explorer.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="logo" className="text-slate-700 font-medium">Logo URL</Label>
            <Input
              id="logo"
              value={config.layout.navigation.logo}
              onChange={(e) => updateLayout('logo', e.target.value)}
              placeholder="https://example.com/logo.svg"
              className="border-primary/30 focus:border-primary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title" className="text-slate-700 font-medium">Application Title</Label>
            <Input
              id="title"
              value={config.layout.navigation.title}
              onChange={(e) => updateLayout('title', e.target.value)}
              placeholder="My Geospatial Explorer"
              className="border-primary/30 focus:border-primary"
            />
          </div>
        </CardContent>
      </Card>

      <DesignVariantEditor
        design={config.layout.design}
        onUpdate={updateDesign}
      />

      <InterfaceGroupManager
        interfaceGroups={config.interfaceGroups}
        sources={config.sources}
        onUpdate={updateConfig}
      />

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-primary">Exclusivity Sets</CardTitle>
          <CardDescription>
            Define which layers should be mutually exclusive (only one can be active at a time).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newExclusivitySet}
                onChange={(e) => setNewExclusivitySet(e.target.value)}
                placeholder="Enter exclusivity set name"
                onKeyPress={(e) => e.key === 'Enter' && addExclusivitySet()}
                className="border-primary/30 focus:border-primary"
              />
              <Button 
                onClick={addExclusivitySet}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {config.exclusivitySets.map((set: string, index: number) => (
                <Badge key={index} variant="outline" className="flex items-center gap-2 border-primary/30 text-primary">
                  {set}
                  <button
                    onClick={() => removeExclusivitySet(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LayoutTab;
