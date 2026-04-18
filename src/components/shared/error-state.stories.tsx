import type { Meta, StoryObj } from '@storybook/react';
import { ErrorState } from './error-state';

const meta: Meta<typeof ErrorState> = {
  title: 'Shared/ErrorState',
  component: ErrorState,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Error title displayed prominently',
    },
    description: {
      control: 'text',
      description: 'Additional error details',
    },
    hint: {
      control: 'text',
      description: 'Optional hint for the user',
    },
    retry: {
      control: 'object',
      description: 'Retry action configuration',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Greška pri učitavanju',
    description: 'Podaci se nisu mogli učitati. Provjerite svoju internetsku vezu.',
  },
};

export const WithRetry: Story = {
  args: {
    title: 'Mrežna greška',
    description: 'Nismo uspjeli povezati s poslužiteljem.',
    retry: {
      onRetry: () => console.log('Retry clicked'),
      label: 'Pokušaj ponovo',
    },
  },
};

export const WithHint: Story = {
  args: {
    title: 'Podaci nedostupni',
    description: 'ZSE poslužitelj trenutno ne vraća podatke.',
    hint: 'Pokušajte ponovo za nekoliko minuta tijekom radnog vremena burze.',
    retry: {
      onRetry: () => console.log('Retry clicked'),
    },
  },
};

export const NetworkError: Story = {
  args: {
    title: 'Problem s mrežom',
    description: 'Provjerite svoju internetsku vezu i pokušajte ponovo.',
    retry: {
      onRetry: () => console.log('Retry clicked'),
      label: 'Osvježi',
    },
  },
};

export const ApiError: Story = {
  args: {
    title: 'Greška poslužitelja',
    description: 'Došlo je do neočekivane greške. Pokušajte kasnije.',
    hint: 'Ako se problem nastavlja, kontaktirajte podršku.',
  },
};

export const Minimal: Story = {
  args: {
    title: 'Error',
  },
};
