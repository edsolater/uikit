import _Link from 'next/link'
import { FC } from 'react'

const Link: FC<{ as?: 'a'; to?: string; isActive?: boolean; className?: string }> = ({
  className,
  children,
  as,
  to = '/',
  isActive
}) => {
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
export default Link
