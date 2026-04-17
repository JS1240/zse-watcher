import type { Meta, StoryObj } from '@storybook/react';
import { TickerSelect } from './ticker-select';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock stock data for Croatian investors
const mockStocks = [
  { ticker: 'KOEI-R-A', name: 'Končar - Elektroindustrija d.d.', changePct: 1.25, volume: 5420, price: 175.50 },
  { ticker: 'RIVP-R-A', name: 'Radno vrijeme d.d.', changePct: -0.85, volume: 12300, price: 4.82 },
  { ticker: 'ADPL-R-A', name: 'Adris Grupa d.d.', changePct: 2.10, volume: 8900, price: 58.90 },
  { ticker: 'HT-R-A', name: 'Hrvatski Telekom d.d.', changePct: 0.45, volume: 21500, price: 32.10 },
  { ticker: 'INA-R-NA', name: 'INA d.d.', changePct: -1.20, volume: 45000, price: 480.00 },
  { ticker: 'DLKV-R-A', name: 'Dalekovod d.d.', changePct: 5.30, volume: 3200, price: 2.15 },
  { ticker: 'ERNT-R-A', name: 'Ericsson Nikola Tesla d.d.', changePct: 0.80, volume: 1800, price: 198.00 },
  { ticker: 'ZABA-R-A', name: 'Zagrebačka banka d.d.', changePct: -0.30, volume: 67000, price: 6.72 },
  { ticker: 'PBZ-R-A', name: 'Privredna banka Zagreb d.d.', changePct: 0.15, volume: 12000, price: 95.50 },
  { ticker: 'VTRS-R-A', name: 'Viatris d.o.o.', changePct: -0.55, volume: 450, price: 18.20 },
];

// Create a custom query client with pre-seeded data
const createMockQueryClient = () => {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: Infinity,
        gcTime: Infinity,
      },
    },
  });
  
  // Pre-populate the cache with mock data
  client.setQueryData(['stocks', 'live'], { stocks: mockStocks });
  
  return client;
};

const meta: Meta<typeof TickerSelect> = {
  title: 'Shared/TickerSelect',
  component: TickerSelect,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Stock ticker autocomplete select for Croatian retail investors. Type to filter stocks by ticker or company name. Supports keyboard navigation: Arrow keys to navigate, Enter to select, Escape to close.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => {
      const mockClient = createMockQueryClient();
      return (
        <QueryClientProvider client={mockClient}>
          <div className="w-80 p-4">
            <Story />
          </div>
        </QueryClientProvider>
      );
    },
  ],
  argTypes: {
    placeholder: { control: 'text' },
    error: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: '',
    placeholder: 'KOEI-R-A',
    onChange: () => {},
  },
};

export const WithValue: Story = {
  args: {
    value: 'HT-R-A',
    placeholder: 'HT-R-A',
    onChange: () => {},
  },
};

export const WithError: Story = {
  args: {
    value: '',
    placeholder: 'KOEI-R-A',
    error: true,
    onChange: () => {},
  },
};

export const SearchingByTicker: Story = {
  name: 'Searching (by ticker)',
  args: {
    value: 'KO',
    placeholder: 'Pretraži...',
    onChange: () => {},
  },
};

export const SearchingByName: Story = {
  name: 'Searching (by name)',
  args: {
    value: 'Telekom',
    placeholder: 'Pretraži...',
    onChange: () => {},
  },
};

export const WithCustomPlaceholder: Story = {
  args: {
    value: '',
    placeholder: 'Odaberi dionicu...',
    onChange: () => {},
  },
};
