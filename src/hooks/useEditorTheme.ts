
import { useState, useEffect } from 'react';

type EditorTheme = 'vs' | 'vs-dark';

const STORAGE_KEY = 'json-editor-theme';

export const useEditorTheme = () => {
  const [editorTheme, setEditorTheme] = useState<EditorTheme>('vs');

  useEffect(() => {
    const savedTheme = localStorage.getItem(STORAGE_KEY) as EditorTheme;
    if (savedTheme && (savedTheme === 'vs' || savedTheme === 'vs-dark')) {
      setEditorTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme: EditorTheme = editorTheme === 'vs' ? 'vs-dark' : 'vs';
    setEditorTheme(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
  };

  return { editorTheme, toggleTheme };
};
