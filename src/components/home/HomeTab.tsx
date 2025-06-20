
import React from 'react';
import ConfigFileManager from './ConfigFileManager';
import ConfigMetadataEditor from './ConfigMetadataEditor';
import ConfigStats from './ConfigStats';

const HomeTab = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Configuration Home</h2>
        <p className="text-muted-foreground">
          Manage your configuration settings, import/export files, and view overview statistics.
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <ConfigFileManager />
          <ConfigStats />
        </div>
        
        <div>
          <ConfigMetadataEditor />
        </div>
      </div>
    </div>
  );
};

export default HomeTab;
