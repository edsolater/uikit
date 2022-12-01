import { Cover, isArray, isObject } from '@edsolater/fnkit'
import { isValidElement, ReactNode } from 'react'
import { DivChildNode, DivProps } from '../type'

export function parseDivChildren(children?: DivChildNode): ReactNode {
  if (isObject(children) && !isArray(children) && !isValidElement(children)) return String(children)
  return children as ReactNode
}

export function handleDivChildren<P extends Partial<DivProps<any>>>(
  divProps?: P
): (Omit<P, 'childrend'> & { children?: ReactNode }) | undefined {
  if (!divProps) return
  return { ...divProps, children: parseDivChildren(divProps.children) } as (Omit<P, 'childrend'> & { children?: ReactNode })
}
