import type { Meta, StoryObj } from '@storybook/react';
import { MarketOverviewSkeleton } from './market-overview-skeleton';

const meta: Meta<typeof MarketOverviewSkeleton> = {
  title: 'Market/MarketOverviewSkeleton',
  component: MarketOverviewSkeleton,
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