import { useState, useEffect, useCallback } from 'react';
import { ChartConfig } from '@/types/chart';
import { fetchAndParseCSV, ParsedCSVData, getNumericColumns, getDateColumns } from '@/utils/csvParser';

interface UseChartEditorStateProps {
  initialConfig?: ChartConfig;
}

export function useChartEditorState({ initialConfig }: UseChartEditorStateProps) {
  const [config, setConfig] = useState<ChartConfig>(initialConfig || {
    chartType: 'xy',
    title: '',
    x: '',
    traces: [],
    layout: { height: 400, showlegend: true },
  });

  const [parsedData, setParsedData] = useState<ParsedCSVData>({ columns: [], data: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTraceIndex, setSelectedTraceIndex] = useState<number | null>(null);

  // Sync config when initialConfig changes (e.g., when editing a different chart)
  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
      // Select the first trace if available
      if (initialConfig.traces && initialConfig.traces.length > 0) {
        setSelectedTraceIndex(0);
      }
    }
  }, [initialConfig]);

  const numericColumns = getNumericColumns(parsedData.data, parsedData.columns);
  const dateColumns = getDateColumns(parsedData.data, parsedData.columns);

  // Fetch CSV when sources change
  useEffect(() => {
    const source = config.sources?.[0];
    if (!source?.url) {
      setParsedData({ columns: [], data: [] });
      return;
    }

    setIsLoading(true);
    fetchAndParseCSV(source.url)
      .then(setParsedData)
      .finally(() => setIsLoading(false));
  }, [config.sources?.[0]?.url]);

  const updateConfig = useCallback((updates: Partial<ChartConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const updateTrace = useCallback((index: number, trace: ChartConfig['traces'][0]) => {
    setConfig(prev => ({
      ...prev,
      traces: prev.traces?.map((t, i) => i === index ? trace : t) || [],
    }));
  }, []);

  const removeTrace = useCallback((index: number) => {
    setConfig(prev => {
      const newTraces = prev.traces?.filter((_, i) => i !== index) || [];
      return { ...prev, traces: newTraces };
    });
    
    // Calculate and set new selected index after removal
    setSelectedTraceIndex(currentIndex => {
      // Get current trace count before removal
      const currentTraceCount = config.traces?.length || 0;
      const newTraceCount = currentTraceCount - 1;
      
      if (newTraceCount === 0) {
        return null;
      } else if (index >= newTraceCount) {
        // Deleted the last trace, select the new last one
        return newTraceCount - 1;
      } else {
        // Keep the same index (which now points to what was the next trace)
        return index;
      }
    });
  }, [config.traces?.length]);

  return {
    config,
    setConfig,
    updateConfig,
    parsedData,
    isLoading,
    numericColumns,
    dateColumns,
    selectedTraceIndex,
    setSelectedTraceIndex,
    updateTrace,
    removeTrace,
  };
}
