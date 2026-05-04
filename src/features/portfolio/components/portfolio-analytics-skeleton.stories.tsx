import type { Meta, StoryObj } from '@storybook/react';
import { PortfolioAnalyticsSkeleton } from './portfolio-analytics-skeleton';

const meta: Meta<typeof PortfolioAnalyticsSkeleton> = {
  title: 'Portfolio/PortfolioAnalyticsSkeleton',
  component: PortfolioAnalyticsSkeleton,
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