import { Cover, isObject } from '@edsolater/fnkit'
import { ReactNode } from 'react'
import { DivProps } from '../type'

function parseDivChildren(children: DivProps['children']): ReactNode {
  if (isObject(children) && Object.getOwnPropertySymbols(children).includes(Symbol.toPrimitive)) return String(children)
  return children as ReactNode
}

export function handleDivChildren<P extends Partial<DivProps<any>>>(
  divProps?: P
): Cover<P, { children?: ReactNode }> | undefined {
  if (!divProps) return
  return { ...divProps, children: parseDivChildren(divProps.children) } as Cover<P, { children?: ReactNode }>
}
