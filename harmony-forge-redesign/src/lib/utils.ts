import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

const customTwMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      shadow: [{ shadow: ['sm', 'md', 'lg', 'xl', 'inner'] }],
      rounded: [{ rounded: ['none', 'sharp', 'micro', 'standard', 'md', 'lg', 'xl', '2xl', '3xl', 'full'] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return customTwMerge(clsx(inputs))
}
