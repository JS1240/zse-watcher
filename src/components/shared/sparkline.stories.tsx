import type { Meta, StoryObj } from "@storybook/react";
import { Sparkline } from "./sparkline";

const meta: Meta<typeof Sparkline> = {
  title: "Shared/Sparkline",
  component: Sparkline,
  tags: ["autodocs"],
  argTypes: {
    width: { control: "number" },
    height: { control: "number" },
  },
  parameters: {
    docs: {
      description: {
        component: "Mini sparkline chart for price trend visualization. Green if up, red if down.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Sparkline>;

export const UpTrend: Story = {
  args: {
    data: [100, 102, 101, 103, 105, 104, 106, 108, 107, 109],
    width: 60,
    height: 20,
  },
  render: (args) => (
    <div className="flex items-center justify-center p-4">
      <Sparkline {...args} />
    </div>
  ),
};

export const DownTrend: Story = {
  args: {
    data: [109, 107, 108, 106, 104, 105, 103, 101, 102, 100],
    width: 60,
    height: 20,
  },
  render: (args) => (
    <div className="flex items-center justify-center p-4">
      <Sparkline {...args} />
    </div>
  ),
};

export const FlatTrend: Story = {
  args: {
    data: [100, 100, 100, 100, 100, 100, 100, 100],
    width: 60,
    height: 20,
  },
  render: (args) => (
    <div className="flex items-center justify-center p-4">
      <Sparkline {...args} />
    </div>
  ),
};

export const Volatile: Story = {
  args: {
    data: [100, 95, 105, 98, 102, 97, 103, 99, 101, 100],
    width: 60,
    height: 20,
  },
  render: (args) => (
    <div className="flex items-center justify-center p-4">
      <Sparkline {...args} />
    </div>
  ),
};

export const Larger: Story = {
  args: {
    data: [100, 102, 101, 103, 105, 104, 106, 108, 107, 109, 110, 112, 111, 113, 115],
    width: 120,
    height: 40,
  },
  render: (args) => (
    <div className="flex items-center justify-center p-4">
      <Sparkline {...args} />
    </div>
  ),
};

export const EmptyData: Story = {
  args: {
    data: [],
    width: 60,
    height: 20,
  },
  render: (args) => (
    <div className="flex items-center justify-center p-4">
      <Sparkline {...args} />
    </div>
  ),
};

export const SinglePoint: Story = {
  args: {
    data: [100],
    width: 60,
    height: 20,
  },
  render: (args) => (
    <div className="flex items-center justify-center p-4">
      <Sparkline {...args} />
    </div>
  ),
};

export const WithClassName: Story = {
  args: {
    data: [100, 102, 105, 103, 106, 108, 110],
    width: 60,
    height: 20,
    className: "opacity-50",
  },
  render: (args) => (
    <div className="flex items-center justify-center p-4">
      <Sparkline {...args} />
    </div>
  ),
};