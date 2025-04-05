import { tv } from 'tailwind-variants'

export const wrapperStyle = tv({
  base: 'sticky top-0 z-40 flex h-[var(--fd-banner-height)] items-center justify-center px-8 bg-[url("/images/banner_bg.png")] bg-blend-overlay',
  variants: {
    variant: {
      light: 'bg-liam-green-300',
      dark: 'bg-liam-green-700',
    },
  },
})

export const textStyle = tv({
  base: 'text-[10px] sm:text-sm font-mono font-medium overflow-hidden text-overflow-ellipsis line-clamp-2 leading-snug',
  variants: {
    variant: {
      light: 'text-base-black',
      dark: 'text-liam-green-400',
    },
  },
})

export const linkStyle = tv({
  base: 'py-0.5 px-2 text-base-black text-[10px] sm:text-sm font-medium font-mono whitespace-nowrap hover:underline',
  variants: {
    variant: {
      light: 'bg-base-white',
      dark: 'bg-liam-green-400',
    },
  },
})

export const buttonStyle = tv({
  base: 'absolute end-2 top-1/2 -translate-y-1/2',
  variants: {
    variant: {
      light: 'text-base-black',
      dark: 'text-liam-green-400',
    },
  },
})