import type { Meta, StoryObj } from '@storybook/react';
import { WatchlistSkeleton } from './watchlist-skeleton';

const meta: Meta<typeof WatchlistSkeleton> = {
  title: 'Watchlist/WatchlistSkeleton',
  component: WatchlistSkeleton,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    rows: {
      control: 'number',
      min: 1,
      max: 20,
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    rows: 5,
  },
};

export const Empty: Story = {
  args: {
    rows: 0,
  },
};

export const FewRows: Story = {
  args: {
    rows: 3,
  },
};

export const ManyRows: Story = {
  args: {
    rows: 15,
  },
};

export const SingleRow: Story = {
  args: {
    rows: 1,
  },
};