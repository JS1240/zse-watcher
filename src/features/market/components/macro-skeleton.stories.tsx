import type { Meta, StoryObj } from '@storybook/react';
import { MacroSkeleton } from './macro-skeleton';

const meta: Meta<typeof MacroSkeleton> = {
  title: 'Market/MacroSkeleton',
  component: MacroSkeleton,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'Default',
};