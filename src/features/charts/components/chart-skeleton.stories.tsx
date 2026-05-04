import type { Meta, StoryObj } from '@storybook/react';
import { ChartSkeleton } from './chart-skeleton';

const meta: Meta<typeof ChartSkeleton> = {
  title: 'Charts/ChartSkeleton',
  component: ChartSkeleton,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    height: {
      control: 'number',
      min: 100,
      max: 600,
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    height: 300,
  },
};

export const Small: Story = {
  args: {
    height: 200,
  },
  name: 'Small (200px)',
};

export const Tall: Story = {
  args: {
    height: 400,
  },
  name: 'Tall (400px)',
};

export const Compact: Story = {
  args: {
    height: 150,
  },
  name: 'Compact (150px)',
};