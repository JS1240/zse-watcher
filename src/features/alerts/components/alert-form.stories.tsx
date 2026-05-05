import type { Meta, StoryObj } from '@storybook/react';
import { AlertForm } from './alert-form';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const meta: Meta<typeof AlertForm> = {
  title: 'Alerts/AlertForm',
  component: AlertForm,
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
      // Mock stocks data for ticker validation
      mockClient.setQueryData(['stocksLive'], {
        stocks: [
          { ticker: 'RIVP', name: 'Riviera Adris', price: 42.5, changePct: 2.34, sector: 'Hoteli i turizam', volume: 12500, turnover: 515000, isin: 'HRRIVP0001', dividendYield: 4.2, peRatio: 21.4, marketCapM: 408 },
          { ticker: 'HT', name: 'Hrvatski Telekom', price: 28.9, changePct: -1.45, sector: 'Telekomunikacije', volume: 8900, turnover: 257100, isin: 'HRHT0001', dividendYield: 5.1, peRatio: 9.3, marketCapM: 2640 },
          { ticker: 'AD', name: 'Adris grupa', price: 55.0, changePct: 0, sector: 'Hoteli i turizam', volume: 3200, turnover: 176000, isin: 'HRAD0001', dividendYield: 6.3, peRatio: 12.4, marketCapM: 892 },
        ],
      });
      return (
        <QueryClientProvider client={mockClient}>
          <div className="max-w-3xl">
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
    onClose: () => {},
    onSuccess: undefined,
  },
  name: 'Default State',
};

export const WithDefaultTicker: Story = {
  args: {
    onClose: () => {},
    defaultTicker: 'RIVP',
    defaultCondition: 'above',
    defaultTargetValue: 45,
  },
  name: 'Pre-filled Ticker',
};

export const AboveCondition: Story = {
  args: {
    onClose: () => {},
    defaultTicker: 'RIVP',
    defaultCondition: 'above',
    defaultTargetValue: 45,
  },
  name: 'Above Condition',
};

export const BelowCondition: Story = {
  args: {
    onClose: () => {},
    defaultTicker: 'HT',
    defaultCondition: 'below',
    defaultTargetValue: 27,
  },
  name: 'Below Condition',
};

export const PercentChangeUp: Story = {
  args: {
    onClose: () => {},
    defaultTicker: 'RIVP',
    defaultCondition: 'percent_change_up',
    defaultTargetValue: 3,
  },
  name: 'Percent Change Up',
};

export const PercentChangeDown: Story = {
  args: {
    onClose: () => {},
    defaultTicker: 'HT',
    defaultCondition: 'percent_change_down',
    defaultTargetValue: 5,
  },
  name: 'Percent Change Down',
};

export const Loading: Story = {
  args: {
    onClose: () => {},
  },
  name: 'Loading State',
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
};

export const LongTicker: Story = {
  args: {
    onClose: () => {},
    defaultTicker: 'KOEI-R-A',
    defaultCondition: 'above',
    defaultTargetValue: 150,
  },
  name: 'Long Ticker Symbol',
};