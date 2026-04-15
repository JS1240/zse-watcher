import type { Meta, StoryObj } from '@storybook/react';
import { EmptyState } from './empty-state';
import { Search, Star, TrendingUp, AlertCircle } from 'lucide-react';

const meta: Meta<typeof EmptyState> = {
  title: 'Shared/EmptyState',
  component: EmptyState,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    icon: <Search className="h-8 w-8" />,
    title: 'No results found',
    description: 'Try adjusting your search terms',
  },
};

export const WithAction: Story = {
  args: {
    icon: <Star className="h-8 w-8" />,
    title: 'No stocks in watchlist',
    description: 'Add stocks from the browser to track them here',
    action: {
      label: 'Browse Stocks',
      onClick: () => console.log('Browse'),
    },
  },
};

export const WithHint: Story = {
  args: {
    icon: <TrendingUp className="h-8 w-8" />,
    title: 'Great progress',
    description: 'Your portfolio is growing well',
    hint: 'Tip: Diversify across sectors to reduce risk',
  },
};

export const Warning: Story = {
  args: {
    icon: <AlertCircle className="h-8 w-8" />,
    title: 'Network error',
    description: 'Unable to fetch latest prices',
    action: {
      label: 'Retry',
      onClick: () => console.log('Retry'),
    },
    variant: 'warning',
  },
};

export const NoResults: Story = {
  args: {
    icon: <Search className="h-8 w-8" />,
    title: 'No results',
    description: 'Try a different search term',
    action: {
      label: 'Clear filters',
      onClick: () => console.log('Clear'),
    },
    variant: 'no-results',
  },
};