
import React from 'react';
import Editor from '@monaco-editor/react';

interface MonacoJsonEditorProps {
  value: string;
  onChange?: (value: string | undefined) => void;
  readOnly?: boolean;
  theme?: 'vs' | 'vs-dark';
  height?: string;
}

const MonacoJsonEditor = ({ 
  value, 
  onChange, 
  readOnly = false, 
  theme = 'vs-dark',
  height = '400px' 
}: MonacoJsonEditorProps) => {
  const options = {
    readOnly,
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbers: 'on' as const,
    scrollBeyondLastLine: false,
    wordWrap: 'on' as const,
    folding: true,
    tabSize: 2,
    insertSpaces: true,
    automaticLayout: true,
    ...(readOnly ? {} : {
      formatOnPaste: true,
      formatOnType: true,
    })
  };

  return (
    <div className="border rounded-md border-primary/20 overflow-hidden">
      <Editor
        height={height}
        defaultLanguage="json"
        value={value}
        onChange={onChange}
        theme={theme}
        options={options}
      />
    </div>
  );
};

export default MonacoJsonEditor;
