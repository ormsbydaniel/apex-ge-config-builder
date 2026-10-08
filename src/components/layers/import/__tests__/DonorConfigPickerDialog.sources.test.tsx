import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DonorConfigPickerDialog from '../DonorConfigPickerDialog';

const loadFromUrl = vi.fn();

vi.mock('@/hooks/useDonorConfigLoader', () => ({
  useDonorConfigLoader: () => ({
    loadFromFile: vi.fn(),
    loadFromUrl,
  }),
}));

vi.mock('@/components/ui/tabs', async () => {
  const React = await import('react');
  const TabsContext = React.createContext<(value: string) => void>(() => undefined);
  return {
    Tabs: ({ onValueChange, children }: { onValueChange: (value: string) => void; children: React.ReactNode }) => (
      <TabsContext.Provider value={onValueChange}><div>{children}</div></TabsContext.Provider>
    ),
    TabsList: ({ children }: { children: React.ReactNode }) => <div role="tablist">{children}</div>,
    TabsTrigger: ({ value, children }: { value: string; children: React.ReactNode }) => {
      const onValueChange = React.useContext(TabsContext);
      return <button role="tab" onClick={() => onValueChange(value)}>{children}</button>;
    },
    TabsContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  };
});

vi.mock('@/utils/exampleManifest', () => ({
  EXAMPLES_MANIFEST_URL: 'https://example.test/manifest.json',
  fetchExampleManifest: vi.fn().mockResolvedValue({
    examples: [],
    testConfigs: [{
      id: 'stac-datasets',
      name: 'STAC datasets',
      description: 'STAC test configuration',
      url: 'https://example.test/stac.json',
      fileName: 'stac.json',
    }],
    recommended: {},
  }),
}));

vi.mock('@/utils/tutorialConfigs', () => ({
  TUTORIALS_FOLDER_URL: 'https://example.test/tutorials',
  fetchTutorialConfigs: vi.fn().mockResolvedValue([{
    id: 'tutorial-4-completion',
    tutorial: 4,
    kind: 'completion',
    name: 'Tutorial 4 completion',
    description: 'Finished result of Tutorial 4',
    url: 'https://example.test/tutorial-4.json',
    fileName: 'tutorial-4.json',
  }]),
}));

const renderDialog = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <DonorConfigPickerDialog open onOpenChange={vi.fn()} />
    </QueryClientProvider>,
  );
};

describe('Import Layer Card configuration sources', () => {
  beforeEach(() => {
    loadFromUrl.mockReset();
  });

  it('offers test configurations from the examples manifest', async () => {
    loadFromUrl.mockResolvedValueOnce({
      success: true,
      config: { sources: [] },
      source: { type: 'example', label: 'STAC datasets' },
    });
    renderDialog();

    fireEvent.click(screen.getByRole('tab', { name: 'Examples' }));
    fireEvent.click(await screen.findByRole('button', { name: /STAC datasets/ }));

    await waitFor(() => expect(loadFromUrl).toHaveBeenCalledWith(
      'https://example.test/stac.json',
      { type: 'example', label: 'STAC datasets' },
      expect.any(Object),
    ));
  });

  it('gives the source tabs a full-height scrolling content row', () => {
    renderDialog();

    const tabList = screen.getByRole('tablist');
    const tabs = tabList.parentElement;
    expect(tabs).toHaveClass('grid', 'min-h-0', 'flex-1', 'grid-rows-[auto_minmax(0,1fr)]');

    const uploadPanel = screen.getByText('Upload a donor configuration JSON file').closest('[role="tabpanel"]');
    expect(uploadPanel).toHaveClass('h-full', 'min-h-0', 'overflow-y-auto');
  });

  it('offers tutorial configurations as donor sources', async () => {
    loadFromUrl.mockResolvedValueOnce({
      success: true,
      config: { sources: [] },
      source: { type: 'example', label: 'Tutorial 4 completion' },
    });
    renderDialog();

    fireEvent.click(screen.getByRole('tab', { name: 'Tutorials' }));
    fireEvent.click(await screen.findByRole('button', { name: /Tutorial 4 completion/ }));

    await waitFor(() => expect(loadFromUrl).toHaveBeenCalledWith(
      'https://example.test/tutorial-4.json',
      { type: 'example', label: 'Tutorial 4 completion' },
      expect.any(Object),
    ));
  });
});