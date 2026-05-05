import type { Meta, StoryObj } from '@storybook/react';
import { StockTableSkeleton } from './stock-table-skeleton';

const meta: Meta<typeof StockTableSkeleton> = {
  title: 'Features/Stocks/StockTableSkeleton',
  component: StockTableSkeleton,
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

export const Mobile: Story = {
  name: 'Mobile View',
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const Tablet: Story = {
  name: 'Tablet View',
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

export const WideDesktop: Story = {
  name: 'Wide Desktop',
  parameters: {
    viewport: {
      defaultViewport: 'xlDesktop',
    },
  },
};