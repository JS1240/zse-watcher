import type { Meta, StoryObj } from '@storybook/react';
import { PricingSkeleton } from './pricing-skeleton';

const meta: Meta<typeof PricingSkeleton> = {
  title: 'Premium/PricingSkeleton',
  component: PricingSkeleton,
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