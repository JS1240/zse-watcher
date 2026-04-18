import type { Meta, StoryObj } from '@storybook/react';
import { Highlight } from './highlight';

const meta: Meta<typeof Highlight> = {
  title: 'Shared/Highlight',
  component: Highlight,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    text: {
      control: 'text',
      description: 'Text to display with highlighting',
    },
    highlight: {
      control: 'text',
      description: 'Substring to highlight within the text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    text: 'ATPL-R-A',
    highlight: 'AT',
  },
};

export const FullMatch: Story = {
  args: {
    text: 'HT',
    highlight: 'HT',
  },
};

export const NoMatch: Story = {
  args: {
    text: 'ADPL-R-A',
    highlight: 'XXX',
  },
};

export const MultipleMatches: Story = {
  args: {
    text: 'ATPL-R-A ima dionicu ATPL',
    highlight: 'AT',
  },
};

export const CaseInsensitive: Story = {
  args: {
    text: 'Adris grupa d.d.',
    highlight: 'AD',
  },
};

export const EmptyText: Story = {
  args: {
    text: '',
    highlight: 'AT',
  },
};

export const EmptyHighlight: Story = {
  args: {
    text: 'ATPL-R-A',
    highlight: '',
  },
};
