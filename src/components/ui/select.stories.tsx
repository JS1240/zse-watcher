import type { Meta, StoryObj } from "@storybook/react";
import { Select, SelectInput } from "./select";

const meta: Meta<typeof Select> = {
  title: "UI/Select",
  component: Select,
  tags: ["autodocs"],
  argTypes: {
    error: { control: "boolean" },
    disabled: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Select>;

const options = [
  { value: "2024", label: "2024" },
  { value: "2023", label: "2023" },
  { value: "2022", label: "2022" },
  { value: "2021", label: "2021" },
];

export const Default: Story = {
  render: (args) => (
    <div className="w-[200px]">
      <Select {...args} />
    </div>
  ),
  args: {
    options,
    placeholder: "Odaberi godinu...",
    value: "",
  },
};

export const WithValue: Story = {
  render: () => (
    <div className="w-[200px]">
      <Select
        options={options}
        placeholder="Odaberi godinu..."
        value="2024"
        onChange={(value) => console.log("Selected:", value)}
      />
    </div>
  ),
};

export const Error: Story = {
  render: () => (
    <div className="w-[200px]">
      <Select
        options={options}
        placeholder="Odaberi godinu..."
        value=""
        error
      />
    </div>
  ),
};

export const SelectInputStories: StoryObj<typeof SelectInput> = {
  render: () => (
    <div className="flex gap-2">
      <SelectInput
        options={options}
        value="2024"
        onChange={(value) => console.log("Selected:", value)}
      />
      <SelectInput
        options={options}
        value=""
      />
    </div>
  ),
};