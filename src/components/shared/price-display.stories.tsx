import type { Meta, StoryObj } from '@storybook/react';
import { PriceDisplay } from './price-display';

const meta: Meta<typeof PriceDisplay> = {
  title: 'Shared/PriceDisplay',
  component: PriceDisplay,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'number',
      description: 'Price value in EUR',
    },
    currency: {
      control: 'select',
      options: ['EUR', 'HRK', 'USD'],
      description: 'Currency code to display',
    },
    previousValue: {
      control: 'number',
      description: 'Previous value for comparison (optional)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: 125.5,
  },
};

export const WholeNumber: Story = {
  args: {
    value: 150,
  },
};

export const SmallPrice: Story = {
  args: {
    value: 0.85,
  },
};

export const LargePrice: Story = {
  args: {
    value: 2450.75,
  },
};

export const WithHRK: Story = {
  args: {
    value: 125.5,
    currency: 'HRK',
  },
};

export const WithUSD: Story = {
  args: {
    value: 135.99,
    currency: 'USD',
  },
};

export const HighValue: Story = {
  args: {
    value: 15680.0,
  },
};

export const CryptoStyle: Story = {
  args: {
    value: 0.02345678,
    currency: 'BTC',
  },
};
