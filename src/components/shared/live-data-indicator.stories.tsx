import type { Meta, StoryObj } from '@storybook/react';
import { LiveDataIndicator } from './live-data-indicator';

const meta: Meta<typeof LiveDataIndicator> = {
  title: 'Shared/LiveDataIndicator',
  component: LiveDataIndicator,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    updatedAt: {
      control: 'number',
      description: 'TanStack Query dataUpdatedAt timestamp (ms)',
    },
    isFetching: {
      control: 'boolean',
      description: 'Whether data is actively being refetched',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const JustUpdated: Story = {
  args: {
    updatedAt: Date.now(),
    isFetching: false,
  },
};

export const Fetching: Story = {
  args: {
    updatedAt: Date.now(),
    isFetching: true,
  },
};

export const SecondsAgo: Story = {
  args: {
    updatedAt: Date.now() - 30_000, // 30 seconds ago
    isFetching: false,
  },
};

export const MinutesAgo: Story = {
  args: {
    updatedAt: Date.now() - 120_000, // 2 minutes ago
    isFetching: false,
  },
};

export const Stale: Story = {
  args: {
    updatedAt: Date.now() - 600_000, // 10 minutes ago
    isFetching: false,
  },
};
