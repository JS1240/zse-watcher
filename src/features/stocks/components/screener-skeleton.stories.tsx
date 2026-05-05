import type { Meta, StoryObj } from '@storybook/react';
import { ScreenerSkeleton } from './screener-skeleton';

const meta: Meta<typeof ScreenerSkeleton> = {
  title: 'Features/Stocks/ScreenerSkeleton',
  component: ScreenerSkeleton,
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

export const Mobile: Story = {
  name: 'Mobile View',
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const Tablet: Story = {
  name: 'Tablet View',
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

export const WideDesktop: Story = {
  name: 'Wide Desktop',
  parameters: {
    viewport: {
      defaultViewport: 'xlDesktop',
    },
  },
};