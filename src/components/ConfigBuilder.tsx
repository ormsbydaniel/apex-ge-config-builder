
import React from 'react';
import { ConfigProvider } from '@/contexts/ConfigContext';
import MainTabs from './config/MainTabs';

const ConfigBuilder = () => {
  return (
    <ConfigProvider>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Configuration Builder</h1>
            <p className="text-muted-foreground">
              Build and manage your geospatial application configuration
            </p>
          </div>
          <MainTabs />
        </div>
      </div>
    </ConfigProvider>
  );
};

export default ConfigBuilder;
