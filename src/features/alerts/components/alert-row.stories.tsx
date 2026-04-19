import type { Meta, StoryObj } from '@storybook/react';
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
    (Story) => (
      <div className="w-full max-w-2xl rounded-lg border border-border">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockStocks = [
  { ticker: 'RIVP', name: 'Riviera Adris', price: 42.5 },
  { ticker: 'HT', name: 'Hrvatski Telekom', price: 28.9 },
  { ticker: 'AD', name: 'Adris grupa', price: 55.0 },
];

const createAlert = (
  overrides: Partial<{
    id: string;
    ticker: string;
    condition: AlertCondition;
    targetValue: number;
    isActive: boolean;
    isTriggered: boolean;
    createdAt: string;
    isLocal: boolean;
  }> = {}
) => ({
  id: 'alert-1',
  ticker: 'RIVP',
  condition: 'above' as AlertCondition,
  targetValue: 45.0,
  isActive: true,
  isTriggered: false,
  createdAt: '2026-04-15T10:00:00Z',
  isLocal: false,
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

export const PercentCondition: Story = {
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
  name: 'Percent Change Condition',
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
      ticker: 'RIVP-RA-2026',
      targetValue: 100.0,
    }),
    stocks: mockStocks,
    onDelete: () => {},
    onToggle: () => {},
    onUpdate: async () => {},
  },
  name: 'Long Ticker',
};