import type { Meta, StoryObj } from '@storybook/react';
import { AddPositionForm } from './add-position-form';
import type { Holding } from '@/features/portfolio/api/portfolio-queries';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const meta: Meta<typeof AddPositionForm> = {
  title: 'Portfolio/AddPositionForm',
  component: AddPositionForm,
  parameters: {
    layout: 'padded',
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
      mockClient.setQueryData(['stocksLive'], {
        stocks: [
          { ticker: 'RIVP', name: 'Riviera Adris', price: 42.5, changePct: 2.34, sector: 'Hoteli i turizam', volume: 12500, turnover: 515000, isin: 'HRRIVP0001', dividendYield: 4.2, peRatio: 21.4, marketCapM: 408 },
          { ticker: 'HT', name: 'Hrvatski Telekom', price: 28.9, changePct: -1.45, sector: 'Telekomunikacije', volume: 8900, turnover: 257100, isin: 'HRHT0001', dividendYield: 5.1, peRatio: 9.3, marketCapM: 2640 },
          { ticker: 'AD', name: 'Adris grupa', price: 55.0, changePct: 0, sector: 'Hoteli i turizam', volume: 3200, turnover: 176000, isin: 'HRAD0001', dividendYield: 6.3, peRatio: 12.4, marketCapM: 892 },
        ],
      });
      return (
        <QueryClientProvider client={mockClient}>
          <div className="max-w-3xl border border-border rounded-lg bg-card p-4">
            <Story />
          </div>
        </QueryClientProvider>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    holdings: [],
    onClose: () => {},
    onSuccess: undefined,
  },
  name: 'Default State',
};

export const WithHoldings: Story = {
  args: {
    holdings: [
      { ticker: 'RIVP', totalShares: 100, avgPrice: 40.0, totalCost: 4000 },
      { ticker: 'HT', totalShares: 200, avgPrice: 30.0, totalCost: 6000 },
    ] as Holding[],
    onClose: () => {},
    onSuccess: undefined,
  },
  name: 'With Existing Holdings',
};

export const PreFilledTicker: Story = {
  args: {
    holdings: [],
    onClose: () => {},
    onSuccess: undefined,
  },
  name: 'Pre-filled Ticker (RIVP)',
};

export const SellTransaction: Story = {
  args: {
    holdings: [
      { ticker: 'RIVP', totalShares: 100, avgPrice: 40.0, totalCost: 4000 },
    ] as Holding[],
    onClose: () => {},
    onSuccess: undefined,
  },
  name: 'Sell Transaction',
};

export const Loading: Story = {
  args: {
    holdings: [],
    onClose: () => {},
    onSuccess: undefined,
  },
  name: 'Loading State',
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
};