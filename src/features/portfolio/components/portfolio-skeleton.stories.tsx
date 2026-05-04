import type { Meta, StoryObj } from '@storybook/react';
import { PortfolioSkeleton } from './portfolio-skeleton';

const meta: Meta<typeof PortfolioSkeleton> = {
  title: 'Portfolio/PortfolioSkeleton',
  component: PortfolioSkeleton,
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