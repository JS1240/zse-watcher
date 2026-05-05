import type { Meta, StoryObj } from '@storybook/react';
import { InlineTransactionForm } from './inline-transaction-form';

const meta: Meta<typeof InlineTransactionForm> = {
  title: 'Portfolio/InlineTransactionForm',
  component: InlineTransactionForm,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-xl border border-border rounded-lg bg-card p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    ticker: 'RIVP',
    currentPrice: 42.5,
    onClose: () => {},
    onSuccess: undefined,
    ownedShares: undefined,
  },
  name: 'Default (Buy)',
};

export const BuyWithMarketPrice: Story = {
  args: {
    ticker: 'RIVP',
    currentPrice: 42.5,
    onClose: () => {},
    ownedShares: undefined,
  },
  name: 'Buy at Market Price',
};

export const BuyAboveMarket: Story = {
  args: {
    ticker: 'RIVP',
    currentPrice: 42.5,
    onClose: () => {},
    ownedShares: undefined,
  },
  name: 'Buy Above Market (Shows P&L Warning)',
};

export const BuyBelowMarket: Story = {
  args: {
    ticker: 'RIVP',
    currentPrice: 42.5,
    onClose: () => {},
    ownedShares: undefined,
  },
  name: 'Buy Below Market (Shows P&L Opportunity)',
};

export const SellMode: Story = {
  args: {
    ticker: 'RIVP',
    currentPrice: 42.5,
    onClose: () => {},
    ownedShares: 100,
  },
  name: 'Sell Mode',
};

export const SellWithOwnedShares: Story = {
  args: {
    ticker: 'HT',
    currentPrice: 28.9,
    onClose: () => {},
    ownedShares: 250,
  },
  name: 'Sell with Owned Shares',
};

export const InsufficientSharesWarning: Story = {
  args: {
    ticker: 'RIVP',
    currentPrice: 42.5,
    onClose: () => {},
    ownedShares: 50,
  },
  name: 'Insufficient Shares Warning',
};

export const DividendMode: Story = {
  args: {
    ticker: 'AD',
    currentPrice: 55.0,
    onClose: () => {},
    ownedShares: 200,
  },
  name: 'Dividend Mode',
};

export const DarkBackground: Story = {
  args: {
    ticker: 'RIVP',
    currentPrice: 42.5,
    onClose: () => {},
    ownedShares: 100,
  },
  name: 'Dark Background',
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
};