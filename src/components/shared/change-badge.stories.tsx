import type { Meta, StoryObj } from '@storybook/react';
import { ChangeBadge } from './change-badge';

const meta: Meta<typeof ChangeBadge> = {
  title: 'Shared/ChangeBadge',
  component: ChangeBadge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Positive: Story = {
  args: {
    value: 3.45,
  },
};

export const Negative: Story = {
  args: {
    value: -2.15,
  },
};

export const Neutral: Story = {
  args: {
    value: 0,
  },
};

export const WithoutIcon: Story = {
  args: {
    value: 1.25,
    showIcon: false,
  },
};

export const LargePositive: Story = {
  args: {
    value: 12.87,
  },
};

export const LargeNegative: Story = {
  args: {
    value: -8.5,
  },
};