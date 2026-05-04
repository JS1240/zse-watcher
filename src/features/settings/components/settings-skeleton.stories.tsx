import type { Meta, StoryObj } from '@storybook/react';
import { SettingsSkeleton } from './settings-skeleton';

const meta: Meta<typeof SettingsSkeleton> = {
  title: 'Settings/SettingsSkeleton',
  component: SettingsSkeleton,
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