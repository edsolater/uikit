import type { ComponentPropsWithoutRef } from 'react'
import './button.css'

export type ButtonProps = ComponentPropsWithoutRef<'button'> & {
  variant?: 'solid' | 'ghost'
}

export function Button({
  variant = 'solid',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  const classes = ['rk-button', `rk-button--${variant}`, className]
    .filter(Boolean)
    .join(' ')

  return <button className={classes} type={type} {...props} />
}