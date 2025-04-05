import { tv } from 'tailwind-variants'

export const linkStyle = tv({
  base: 'flex w-full flex-col gap-2 rounded-lg border bg-fd-card p-4 text-sm transition-colors hover:text-fd-primary hover:bg-transparent hover:border-fd-primary',
  variants: {
    direction: {
      previous: '',
      next: 'col-start-2 text-end',
    },
  },
})

export const itemLabelStyle = tv({
  base: 'inline-flex items-center gap-0.5 text-fd-muted-foreground',
  variants: {
    direction: {
      previous: '',
      next: 'flex-row-reverse',
    },
  },
})