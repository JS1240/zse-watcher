import type { Meta, StoryObj } from '@storybook/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AlertRow } from './alerts-dashboard';
import type { AlertCondition } from '@/types/alert';

const meta: Meta<typeof AlertRow> = {
  title: 'Features/Alerts/AlertRow',
  component: AlertRow,
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
      // Seed empty watchlist to satisfy useWatchlistTickers in AlertRow
      mockClient.setQueryData(['watchlist', null], []);
      return (
        <QueryClientProvider client={mockClient}>
          <div className="w-full max-w-2xl rounded-lg border border-border">
            <Story />
          </div>
        </QueryClientProvider>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockStocks = [
  { ticker: 'RIVP', name: 'Riviera Adris', price: 42.5 },
  { ticker: 'HT', name: 'Hrvatski Telekom', price: 28.9 },
  { ticker: 'AD', name: 'Adris grupa', price: 55.0 },
  { ticker: 'KOEI', name: 'Koncar', price: 156.0 },
];

const createAlert = (
  overrides: Partial<{
    id: string;
    ticker: string;
    condition: AlertCondition;
    targetValue: number;
    isActive: boolean;
    isTriggered: boolean;
    triggeredAt: string | null;
    createdAt: string;
    isLocal: boolean;
    snoozedUntil: string | null;
  }> = {}
) => ({
  id: 'alert-1',
  ticker: 'RIVP',
  condition: 'above' as AlertCondition,
  targetValue: 45.0,
  isActive: true,
  isTriggered: false,
  triggeredAt: null,
  createdAt: '2026-04-15T10:00:00Z',
  isLocal: false,
  snoozedUntil: null,
  ...overrides,
});

export const Active: Story = {
  args: {
    alert: createAlert(),
    stocks: mockStocks,
    onDelete: () => {},
    onToggle: () => {},
    onUpdate: async () => {},
  },
  name: 'Active Alert',
};

export const Triggered: Story = {
  args: {
    alert: createAlert({
      isTriggered: true,
      condition: 'below',
      targetValue: 40.0,
    }),
    stocks: mockStocks,
    onDelete: () => {},
    onToggle: () => {},
    onUpdate: async () => {},
  },
  name: 'Triggered Alert',
};

export const Paused: Story = {
  args: {
    alert: createAlert({
      isActive: false,
    }),
    stocks: mockStocks,
    onDelete: () => {},
    onToggle: () => {},
    onUpdate: async () => {},
  },
  name: 'Paused Alert',
};

export const PercentConditionUp: Story = {
  args: {
    alert: createAlert({
      condition: 'percent_change_up',
      targetValue: 5.0,
    }),
    stocks: mockStocks,
    onDelete: () => {},
    onToggle: () => {},
    onUpdate: async () => {},
  },
  name: 'Percent Change (+5%)',
};

export const PercentConditionDown: Story = {
  args: {
    alert: createAlert({
      condition: 'percent_change_down',
      targetValue: -10.0,
    }),
    stocks: mockStocks,
    onDelete: () => {},
    onToggle: () => {},
    onUpdate: async () => {},
  },
  name: 'Percent Change (-10%)',
};

export const LocalAlert: Story = {
  args: {
    alert: createAlert({
      isLocal: true,
    }),
    stocks: mockStocks,
    onDelete: () => {},
    onToggle: () => {},
    onUpdate: async () => {},
  },
  name: 'Local (Guest) Alert',
};

export const LongTicker: Story = {
  args: {
    alert: createAlert({
      ticker: 'KOEI-R-A-2026',
      targetValue: 100.0,
    }),
    stocks: mockStocks,
    onDelete: () => {},
    onToggle: () => {},
    onUpdate: async () => {},
  },
  name: 'Long Ticker Symbol',
};

export const WithSearchHighlight: Story = {
  args: {
    alert: createAlert(),
    stocks: mockStocks,
    searchHighlight: 'RIV',
    onDelete: () => {},
    onToggle: () => {},
    onUpdate: async () => {},
  },
  name: 'With Search Highlight',
};

export const FlashUp: Story = {
  args: {
    alert: createAlert(),
    stocks: mockStocks,
    flash: 'up',
    onDelete: () => {},
    onToggle: () => {},
    onUpdate: async () => {},
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
    alert: createAlert({
      ticker: 'HT',
    }),
    stocks: mockStocks,
    flash: 'down',
    onDelete: () => {},
    onToggle: () => {},
    onUpdate: async () => {},
  },
  name: 'Flash Down Animation',
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
};