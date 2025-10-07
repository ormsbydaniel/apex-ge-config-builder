
import React, { useRef, useEffect } from 'react';
import Editor, { DiffEditor } from '@monaco-editor/react';

interface MonacoJsonEditorProps {
  value: string;
  onChange?: (value: string | undefined) => void;
  readOnly?: boolean;
  theme?: 'vs' | 'vs-dark';
  height?: string;
  originalValue?: string;
  onCursorPositionChange?: (path: string) => void;
  searchQuery?: string;
  onMatchCountChange?: (count: number) => void;
}

const MonacoJsonEditor = ({ 
  value, 
  onChange, 
  readOnly = false, 
  theme = 'vs-dark',
  height = '400px',
  originalValue,
  onCursorPositionChange,
  searchQuery,
  onMatchCountChange,
}: MonacoJsonEditorProps) => {
  const editorRef = useRef<any>(null);
  const isDiffMode = !!originalValue;

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

  const diffOptions = {
    ...options,
    renderSideBySide: true,
    originalEditable: false,
  };

  // Handle cursor position changes to extract JSON path
  useEffect(() => {
    if (!editorRef.current || !onCursorPositionChange) return;

    const editor = editorRef.current;
    const disposable = editor.onDidChangeCursorPosition((e) => {
      try {
        const model = editor.getModel();
        if (!model) return;

        const position = e.position;
        const offset = model.getOffsetAt(position);
        const jsonText = model.getValue();
        
        // Extract JSON path based on cursor position
        const path = extractJsonPath(jsonText, offset);
        onCursorPositionChange(path);
      } catch (error) {
        console.error('Error extracting JSON path:', error);
      }
    });

    return () => disposable.dispose();
  }, [onCursorPositionChange]);

  // Handle search highlighting
  useEffect(() => {
    if (!editorRef.current || !searchQuery) return;

    const editor = editorRef.current;
    const model = editor.getModel();
    if (!model) return;

    try {
      const matches = model.findMatches(
        searchQuery,
        true,
        false,
        true,
        null,
        true
      );
      
      if (onMatchCountChange) {
        onMatchCountChange(matches.length);
      }

      // Highlight first match
      if (matches.length > 0) {
        editor.setSelection(matches[0].range);
        editor.revealLineInCenter(matches[0].range.startLineNumber);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  }, [searchQuery, onMatchCountChange]);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  return (
    <div className="border rounded-md border-primary/20 overflow-hidden">
      {isDiffMode ? (
        <DiffEditor
          height={height}
          language="json"
          original={originalValue}
          modified={value}
          theme={theme}
          options={diffOptions}
        />
      ) : (
        <Editor
          height={height}
          defaultLanguage="json"
          value={value}
          onChange={onChange}
          theme={theme}
          options={options}
          onMount={handleEditorDidMount}
        />
      )}
    </div>
  );
};

// Helper function to extract JSON path from cursor position
function extractJsonPath(jsonText: string, offset: number): string {
  try {
    const beforeCursor = jsonText.substring(0, offset);
    const lines = beforeCursor.split('\n');
    const currentLine = lines[lines.length - 1];
    
    // Simple path extraction based on indentation and keys
    const path: string[] = [];
    let depth = 0;
    let inString = false;
    let currentKey = '';
    
    for (let i = 0; i < offset; i++) {
      const char = jsonText[i];
      
      if (char === '"' && jsonText[i - 1] !== '\\') {
        inString = !inString;
      }
      
      if (!inString) {
        if (char === '{' || char === '[') {
          if (currentKey) {
            path.push(currentKey);
            currentKey = '';
          }
          depth++;
        } else if (char === '}' || char === ']') {
          depth--;
          if (path.length > 0) {
            path.pop();
          }
        }
      }
      
      if (inString && char !== '"') {
        currentKey += char;
      }
      
      if (!inString && char === ':') {
        if (currentKey && path.length < depth) {
          // Key found
        }
      }
    }
    
    return path.join('.');
  } catch (error) {
    return '';
  }
}

export default MonacoJsonEditor;
