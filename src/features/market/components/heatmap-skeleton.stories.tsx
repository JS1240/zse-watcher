import type { Meta, StoryObj } from '@storybook/react';
import { HeatmapSkeleton } from './heatmap-skeleton';

const meta: Meta<typeof HeatmapSkeleton> = {
  title: 'Market/HeatmapSkeleton',
  component: HeatmapSkeleton,
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