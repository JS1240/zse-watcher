import type { Meta, StoryObj } from "@storybook/react";
import { PerformanceBar } from "./performance-bar";

const meta = {
  title: "Shared/PerformanceBar",
  component: PerformanceBar,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
  argTypes: {
    value: { control: "number" },
    baseline: { control: "number" },
    ceiling: { control: "number" },
    floor: { control: "number" },
    fillPercent: { control: "number" },
    showValue: { control: "boolean" },
    compact: { control: "boolean" },
    colorMode: {
      control: "select",
      options: ["auto", "positive", "negative", "neutral"],
    },
  },
} satisfies Meta<typeof PerformanceBar>;

export default meta;
type Story = StoryObj<typeof meta>;

// 52-week range bar — current price within range
export const RangeBar: Story = {
  args: {
    value: 148,
    baseline: 120,  // 52w low
    ceiling: 195,   // 52w high
    floor: 120,
    showValue: true,
    compact: false,
    colorMode: "auto",
  },
  name: "52-Week Range Bar",
};

// Positive performer
export const PositivePerformance: Story = {
  args: {
    value: 8.5,
    baseline: 0,
    showValue: true,
    compact: false,
    colorMode: "positive",
  },
  name: "Positive Performance",
};

// Negative performer
export const NegativePerformance: Story = {
  args: {
    value: -12.3,
    baseline: 0,
    showValue: true,
    compact: false,
    colorMode: "negative",
  },
  name: "Negative Performance",
};

// Compact inline bar
export const CompactInline: Story = {
  args: {
    value: 65,
    baseline: 50,
    fillPercent: 65,
    showValue: true,
    compact: true,
    colorMode: "neutral",
  },
  name: "Compact Inline",
};

// Click-to-copy enabled
export const WithCopy: Story = {
  args: {
    value: 4.25,
    baseline: 0,
    showValue: true,
    copyValue: "4.25",
    colorMode: "positive",
  },
  name: "With Click-to-Copy",
};

// Multiple bars for comparison (used in story)
export const MultipleComparison: Story = {
  args: { value: 0, baseline: 0 },
  render: () => (
    <div className="space-y-3 w-64">
      <div>
        <p className="text-[10px] text-muted-foreground mb-1">Dividend Yield</p>
        <PerformanceBar value={5.2} baseline={0} ceiling={10} floor={0} colorMode="positive" showValue copyValue="5.2" />
      </div>
      <div>
        <p className="text-[10px] text-muted-foreground mb-1">P/E Ratio vs Sector Avg</p>
        <PerformanceBar value={12.5} baseline={15} ceiling={30} floor={5} colorMode="negative" showValue copyValue="12.5" />
      </div>
      <div>
        <p className="text-[10px] text-muted-foreground mb-1">Price vs 52w High</p>
        <PerformanceBar value={148} baseline={120} ceiling={195} floor={120} showValue copyValue="148" />
      </div>
    </div>
  ),
  name: "Multiple for Comparison",
};