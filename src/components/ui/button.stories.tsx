import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';
import { Plus, Download, Trash2 } from 'lucide-react';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="flex gap-2 p-4 bg-background">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Click me',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Secondary',
    variant: 'secondary',
  },
};

export const Outline: Story = {
  args: {
    children: 'Outline',
    variant: 'outline',
  },
};

export const Ghost: Story = {
  args: {
    children: 'Ghost',
    variant: 'ghost',
  },
};

export const Destructive: Story = {
  args: {
    children: 'Delete',
    variant: 'destructive',
  },
};

export const Small: Story = {
  args: {
    children: 'Small',
    size: 'sm',
  },
};

export const Loading: Story = {
  args: {
    children: 'Loading',
    loading: true,
  },
};

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <Plus className="h-3.5 w-3.5" />
        Add
      </>
    ),
  },
};

export const IconOnly: Story = {
  args: {
    children: <Download className="h-3.5 w-3.5" />,
    variant: 'outline',
    size: 'icon',
  },
};

export const IconOnlyDestructive: Story = {
  args: {
    children: <Trash2 className="h-3.5 w-3.5" />,
    variant: 'destructive',
    size: 'icon',
  },
};