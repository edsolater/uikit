import React, { isValidElement, ReactElement, ReactNode } from 'react'
export function mapElementChildren(children: ReactNode, mapper: (child: ReactElement, idx: number) => ReactNode) {
  return React.Children.map(children, (child: ReactNode, idx) => (isValidElement(child) ? mapper(child, idx) : child))
}
