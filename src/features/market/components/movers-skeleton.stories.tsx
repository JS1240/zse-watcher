import type { Meta, StoryObj } from '@storybook/react';
import { MarketMoversSkeleton } from './movers-skeleton';

const meta: Meta<typeof MarketMoversSkeleton> = {
  title: 'Market/MarketMoversSkeleton',
  component: MarketMoversSkeleton,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    count: {
      control: 'number',
      min: 1,
      max: 10,
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    count: 5,
  },
};

export const ThreeRows: Story = {
  args: {
    count: 3,
  },
  name: 'Three Rows',
};

export const TenRows: Story = {
  args: {
    count: 10,
  },
  name: 'Ten Rows',
};