# Storybook for Liam

This directory contains the configuration for Storybook, a tool for developing UI components in isolation.

## Configuration Files

- `main.ts`: Main configuration file for Storybook
- `preview.ts`: Preview configuration for stories
- `preview-head.html`: For including global styles
- `langfuseWeb.mock.ts`: Mock implementation for langfuseWeb
- `vitest.setup.ts`: Setup for testing stories with Vitest

## Framework Configuration

This Storybook setup includes specific configurations for Next.js:

1. **Framework**: Uses `@storybook/nextjs` adapter for Next.js compatibility
2. **Path Aliases**: Supports Next.js path aliases (e.g., `@/components`)
3. **Image Handling**: Properly handles Next.js Image component
4. **CSS Modules**: Supports CSS modules used in Next.js components
5. **API Mocking**: Includes configuration for mocking API calls in stories
