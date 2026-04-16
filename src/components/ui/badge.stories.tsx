import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './badge';

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline', 'success', 'danger'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: 'default',
    children: 'Badge',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    children: '+3.45%',
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: '-2.15%',
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Disabled',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Local',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="success">+3.45%</Badge>
      <Badge variant="danger">-2.15%</Badge>
      <Badge variant="destructive">Disabled</Badge>
      <Badge variant="outline">Local</Badge>
    </div>
  ),
};