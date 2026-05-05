import type { Meta, StoryObj } from '@storybook/react';
import { SectorDrawer } from './sector-drawer';
import type { SectorGroup } from './heatmap';

const mockSector: SectorGroup = {
  sector: 'Hoteli i turizam',
  avgChange: 2.34,
  stocks: [
    { ticker: 'RIVP', changePct: 2.34, turnover: 515000 },
    { ticker: 'AD', changePct: 1.5, turnover: 176000 },
    { ticker: 'HP', changePct: 3.2, turnover: 89000 },
  ],
  totalTurnover: 1250000,
};

const meta: Meta<typeof SectorDrawer> = {
  title: 'Market/SectorDrawer',
  component: SectorDrawer,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="relative min-h-[400px] bg-muted/20 p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    sector: mockSector,
    onClose: () => {},
  },
  name: 'Default',
};

export const SectorWithNegativePerformance: Story = {
  args: {
    sector: {
      sector: 'Telekomunikacije',
      avgChange: -1.45,
      stocks: [
        { ticker: 'HT', changePct: -1.45, turnover: 257100 },
        { ticker: 'RNK', changePct: -0.8, turnover: 124000 },
      ],
      totalTurnover: 890000,
    },
    onClose: () => {},
  },
  name: 'Negative Performance',
};

export const Closed: Story = {
  args: {
    sector: null,
    onClose: () => {},
  },
  name: 'Closed (null)',
};

export const SmallSector: Story = {
  args: {
    sector: {
      sector: 'Nekretnine',
      avgChange: 0.5,
      stocks: [
        { ticker: 'HP', changePct: 0.5, turnover: 125000 },
        { ticker: 'LP', changePct: 0.3, turnover: 45000 },
      ],
      totalTurnover: 125000,
    },
    onClose: () => {},
  },
  name: 'Small Sector (2 stocks)',
};

export const DarkBackground: Story = {
  args: {
    sector: mockSector,
    onClose: () => {},
  },
  name: 'Dark Background',
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
};