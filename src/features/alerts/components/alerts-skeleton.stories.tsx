import type { Meta, StoryObj } from '@storybook/react';
import { AlertsSkeleton } from './alerts-skeleton';

const meta: Meta<typeof AlertsSkeleton> = {
  title: 'Alerts/AlertsSkeleton',
  component: AlertsSkeleton,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    rows: {
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
    rows: 10,
  },
};

export const SingleRow: Story = {
  args: {
    rows: 1,
  },
};