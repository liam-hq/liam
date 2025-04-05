import { tv } from 'tailwind-variants'

export const wrapperStyle = tv({
  variants: {
    as: {
      h1: 'text-3xl',
      h2: 'text-2xl',
      h3: 'text-xl',
      h4: 'text-base',
      h5: 'text-sm',
      h6: 'text-xs',
    },
  },
})