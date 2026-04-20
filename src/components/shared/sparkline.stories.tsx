import type { Meta, StoryObj } from '@storybook/react';
import { Sparkline } from './sparkline';

const meta: Meta<typeof Sparkline> = {
  title: 'Shared/Sparkline',
  component: Sparkline,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    data: {
      control: 'object',
      description: 'Array of numeric values to plot',
    },
    width: {
      control: 'number',
      description: 'SVG width in pixels',
    },
    height: {
      control: 'number',
      description: 'SVG height in pixels',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const upTrend = [100, 102, 101, 105, 108, 107, 110, 112, 115, 118];
const downTrend = [120, 118, 119, 115, 112, 114, 108, 105, 102, 98];
const volatile = [100, 110, 95, 105, 98, 112, 102, 108, 95, 105];
const steady = [100, 101, 100, 102, 101, 100, 101, 102, 101, 100];

export const Upward: Story = {
  args: {
    data: upTrend,
    width: 80,
    height: 24,
  },
};

export const Downward: Story = {
  args: {
    data: downTrend,
    width: 80,
    height: 24,
  },
};

export const Volatile: Story = {
  args: {
    data: volatile,
    width: 80,
    height: 24,
  },
};

export const Steady: Story = {
  args: {
    data: steady,
    width: 80,
    height: 24,
  },
};

export const Small: Story = {
  args: {
    data: upTrend,
    width: 40,
    height: 16,
  },
};

export const Large: Story = {
  args: {
    data: upTrend,
    width: 120,
    height: 32,
  },
};
