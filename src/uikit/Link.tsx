import _Link from 'next/link'
import { ReactNode } from 'react'

export default function Link({
  as,
  to = '/',
  isActive,
  className,
  children
}: {
  as?: 'a'
  to?: string
  isActive?: boolean
  className?: string
  children?: ReactNode
}) {
  return as === 'a' ? (
    <a
      className={`navbar-link opacity-80 hover:opacity-95 active:opacity-60 ${
        isActive ? 'text-secondary' : 'text-link-color'
      } ${className ?? ''}`}
      href={to}
    >
      {children}
    </a>
  ) : (
    <_Link href={to}>
      <a
        className={`navbar-link opacity-80 hover:opacity-95 active:opacity-60 ${
          isActive ? 'text-secondary' : 'text-link-color'
        } ${className ?? ''}`}
      >
        {children}
      </a>
    </_Link>
  )
}
