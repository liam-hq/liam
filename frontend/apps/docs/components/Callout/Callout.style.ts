import { tv } from 'tailwind-variants'

export const wrapperStyle = tv({
  base: 'my-6 p-4 flex items-start gap-2 rounded-lg border',
  variants: {
    type: {
      info: 'border-fd-primary/20 bg-primary-background',
      warn: 'border-warn/20 bg-warn/10',
      error: 'border-danger/20 bg-danger/10',
    },
  },
})