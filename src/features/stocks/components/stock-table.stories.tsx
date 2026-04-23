import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StockTable } from './stock-table';

const meta: Meta<typeof StockTable> = {
  title: 'Features/Stocks/StockTable',
  component: StockTable,
  parameters: {
    layout: 'fullwidth',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => {
      const mockClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            gcTime: Infinity,
          },
        },
      });
      // Seed empty watchlist
      mockClient.setQueryData(['watchlist', null], []);
      return (
        <QueryClientProvider client={mockClient}>
          <div className="rounded-lg border border-border overflow-hidden">
            <Story />
          </div>
        </QueryClientProvider>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// StockTable is a complex component that fetches live data
// These stories provide visual documentation for different states
// In a real scenario, you'd mock useStocksLive response

export const Default: Story = {
  parameters: {
    react: {
      useSuspense: false,
    },
  },
  name: 'Default (loads live data)',
};

export const Loading: Story = {
  parameters: {
    react: {
      useSuspense: false,
    },
  },
  decorators: [
    (Story) => {
      const mockClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            gcTime: Infinity,
          },
        },
      });
      // No data = loading state
      return (
        <QueryClientProvider client={mockClient}>
          <div className="rounded-lg border border-border overflow-hidden">
            <Story />
          </div>
        </QueryClientProvider>
      );
    },
  ],
  name: 'Loading State',
};

export const WithSearch: Story = {
  parameters: {
    react: {
      useSuspense: false,
    },
  },
  name: 'With Search Filter',
};

export const SortedByTurnover: Story = {
  parameters: {
    react: {
      useSuspense: false,
    },
  },
  name: 'Sorted By Turnover',
};

export const FilteredByGainers: Story = {
  parameters: {
    react: {
      useSuspense: false,
    },
  },
  name: 'Filtered By Gainers',
};

export const FilteredBySector: Story = {
  parameters: {
    react: {
      useSuspense: false,
    },
  },
  name: 'Filtered By Sector',
};