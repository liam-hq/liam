# Storybook for Liam

This directory contains the Storybook setup for the Liam project, a tool for developing UI components in isolation.

## Running Storybook

To start Storybook locally, run:

```bash
cd frontend/internal-packages/storybook
pnpm storybook
# or
cd frontend/internal-packages/storybook
npx storybook dev -p 6006
```

This will start Storybook on port 6006. You can access it at http://localhost:6006.

## Building Storybook

To build a static version of Storybook, run:

```bash
cd frontend/internal-packages/storybook
pnpm build
# or
cd frontend/internal-packages/storybook
npx storybook build
```

This will create a static build in the `storybook-static` directory.

## Creating Stories

### File Location

Stories should be placed alongside their corresponding component files:

- UI components: `frontend/packages/ui/src/components/YourComponent.stories.tsx`
- App components: `frontend/apps/app/components/YourComponent.stories.tsx`

### Basic Story Structure

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { YourComponent } from "./YourComponent";

const meta: Meta<typeof YourComponent> = {
  title: "Category/YourComponent",
  component: YourComponent,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    // Define controls for your component props
  },
};

export default meta;
type Story = StoryObj<typeof YourComponent>;

export const Default: Story = {
  args: {
    // Default props
  },
};

// Additional variants
export const Variant: Story = {
  args: {
    // Variant props
  },
};
```

## Best Practices

1. Use the `autodocs` tag to automatically generate documentation
2. Provide meaningful descriptions in `argTypes`
3. Create multiple story variants to showcase different states and use cases
4. Use the `actions` addon to log events
5. Test components in different viewports using the viewport addon
