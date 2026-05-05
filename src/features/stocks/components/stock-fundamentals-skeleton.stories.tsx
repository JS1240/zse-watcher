import type { Meta, StoryObj } from '@storybook/react';
import { StockFundamentalsSkeleton } from './stock-fundamentals-skeleton';

const meta: Meta<typeof StockFundamentalsSkeleton> = {
  title: 'Features/Stocks/StockFundamentalsSkeleton',
  component: StockFundamentalsSkeleton,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'Default',
};

export const WithLongDescription: Story = {
  name: 'With Long Description',
  args: {},
};

export const DarkTheme: Story = {
  name: 'Dark Theme',
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
};

export const LightTheme: Story = {
  name: 'Light Theme',
  parameters: {
    backgrounds: {
      default: 'light',
    },
  },
};