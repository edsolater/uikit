import { Cover, isArray, isObject } from '@edsolater/fnkit'
import { isValidElement, ReactNode } from 'react'
import { DivChildNode, DivProps } from '../type'

export function parseDivChildrenToReactNode(children?: DivChildNode): ReactNode {
  if (isObject(children) && !isArray(children) && !isValidElement(children)) return String(children)
  return children as ReactNode
}

export function handleDivChildren<P extends Partial<DivProps<never, any>>>(
  props?: P
): (Omit<P, 'children'> & { children?: ReactNode }) | undefined {
  if (!props?.children) return props as Omit<P, 'children'>
  return { ...props, children: parseDivChildrenToReactNode(props.children) } as Omit<P, 'children'> & {
    children?: ReactNode
  }
}
