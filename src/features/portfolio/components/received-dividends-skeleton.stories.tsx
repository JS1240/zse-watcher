import type { Meta, StoryObj } from '@storybook/react';
import { ReceivedDividendsSkeleton } from './received-dividends-skeleton';

const meta: Meta<typeof ReceivedDividendsSkeleton> = {
  title: 'Portfolio/ReceivedDividendsSkeleton',
  component: ReceivedDividendsSkeleton,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    rows: {
      control: 'number',
      min: 0,
      max: 10,
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    rows: 3,
  },
};

export const Empty: Story = {
  args: {
    rows: 0,
  },
};

export const FewRows: Story = {
  args: {
    rows: 2,
  },
};

export const ManyRows: Story = {
  args: {
    rows: 5,
  },
};

export const SingleRow: Story = {
  args: {
    rows: 1,
  },
};