import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StockRow } from './stock-row';
import type { Stock } from '@/types/stock';

const meta: Meta<typeof StockRow> = {
  title: 'Features/Stocks/StockRow',
  component: StockRow,
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
      // Seed empty watchlist to satisfy useWatchlistTickers in StockRowBase
      mockClient.setQueryData(['watchlist', null], []);
      return (
        <QueryClientProvider client={mockClient}>
          <div className="min-w-[600px] rounded-lg border border-border overflow-hidden">
            <Story />
          </div>
        </QueryClientProvider>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Sample stock data
const stock1: Stock = {
  ticker: 'RIVP',
  name: 'Riviera Adris d.d.',
  price: 42.5,
  changePct: 2.34,
  volume: 12500,
  turnover: 515000,
  sector: 'Hoteli i turizam',
  isin: 'HRRIVP0001',
  dividendYield: 4.2,
};

const stock2: Stock = {
  ticker: 'HT',
  name: 'Hrvatski Telekom d.d.',
  price: 28.9,
  changePct: -1.45,
  volume: 8900,
  turnover: 257100,
  sector: 'Telekomunikacije',
  isin: 'HRHT0001',
  dividendYield: 5.1,
};

const stock3: Stock = {
  ticker: 'AD',
  name: 'Adris grupa d.d.',
  price: 55.0,
  changePct: 0,
  volume: 3200,
  turnover: 176000,
  sector: 'Hoteli i turizam',
  isin: 'HRAD0001',
  dividendYield: 6.3,
};

export const Default: Story = {
  args: {
    stock: stock1,
  },
};

export const PositiveChange: Story = {
  args: {
    stock: stock1,
  },
  name: 'Positive Change',
};

export const NegativeChange: Story = {
  args: {
    stock: stock2,
  },
  name: 'Negative Change',
};

export const NeutralChange: Story = {
  args: {
    stock: stock3,
  },
  name: 'Neutral Change',
};

export const FlashUp: Story = {
  args: {
    stock: stock1,
    flash: 'up',
  },
  name: 'Flash Up Animation',
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
};

export const FlashDown: Story = {
  args: {
    stock: stock2,
    flash: 'down',
  },
  name: 'Flash Down Animation',
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
};

export const WithSearchQuery: Story = {
  args: {
    stock: stock1,
    searchQuery: 'RIV',
  },
  name: 'With Search Highlight',
};

export const LargeVolume: Story = {
  args: {
    stock: {
      ...stock1,
      ticker: 'KRK',
      name: 'Podravka d.d.',
      price: 156.78,
      changePct: 5.67,
      volume: 1250000,
      turnover: 1959750000,
    },
  },
  name: 'Large Volume',
};