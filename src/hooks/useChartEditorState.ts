import { useState, useEffect, useCallback } from 'react';
import { ChartConfig } from '@/types/chart';
import { fetchAndParseCSV, ParsedCSVData, getNumericColumns } from '@/utils/csvParser';

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

  const numericColumns = getNumericColumns(parsedData.data, parsedData.columns);

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
    setConfig(prev => ({
      ...prev,
      traces: prev.traces?.filter((_, i) => i !== index) || [],
    }));
    setSelectedTraceIndex(null);
  }, []);

  return {
    config,
    setConfig,
    updateConfig,
    parsedData,
    isLoading,
    numericColumns,
    selectedTraceIndex,
    setSelectedTraceIndex,
    updateTrace,
    removeTrace,
  };
}
