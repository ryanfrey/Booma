import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'outline' | 'ghost'
type Size = 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const VARIANTS: Record<Variant, string> = {
  // Teal fill, black text — never white text on bright teal.
  primary: 'bg-brand text-ink hover:bg-brand/90 active:bg-brand/80',
  outline: 'border border-line text-ink hover:border-ink bg-transparent',
  ghost: 'text-brand-ink hover:bg-brand-tint bg-transparent',
}

const SIZES: Record<Size, string> = {
  md: 'h-12 px-5 text-body',
  lg: 'h-14 px-6 text-body',
}

export function Button({ variant = 'primary', size = 'md', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-pill font-semibold tracking-tight transition-colors duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    />
  )
}
