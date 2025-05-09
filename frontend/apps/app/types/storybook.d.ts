declare module '@storybook/react' {
  import type { ComponentType, ElementType, FC } from 'react'

  export interface Meta<TProps> {
    title: string
    component: ComponentType<TProps> | FC<TProps> | ElementType
    parameters?: Record<string, unknown>
    tags?: string[]
    // Add other properties as needed
  }

  export interface StoryObj<TProps> {
    args?: Partial<TProps>
    // Add other properties as needed
  }
}
