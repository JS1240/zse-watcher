import type { Meta, StoryObj } from '@storybook/react';
import { MarketStatusSkeleton } from './market-status-skeleton';

const meta: Meta<typeof MarketStatusSkeleton> = {
  title: 'Market/MarketStatusSkeleton',
  component: MarketStatusSkeleton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'Default',
};