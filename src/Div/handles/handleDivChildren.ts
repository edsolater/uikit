import { isFunction } from '@edsolater/fnkit'
import { JSXElement } from 'solid-js'
import { ValidStatus } from '../../typings/tools'
import { DivChildNode, DivProps } from '../type'

export function parseDivChildrenToJSXElement(children?: DivChildNode, status?: ValidStatus): JSXElement {
  if (isFunction(children)) return children(status ?? {})
  return children
}

export function handleDivChildren<P extends Partial<DivProps>>(
  props?: P,
  status?: ValidStatus
): (Omit<P, 'children'> & { children?: JSXElement }) | undefined {
  if (!props?.children) return props as Omit<P, 'children'>
  return { ...props, children: parseDivChildrenToJSXElement(props.children, status) } as Omit<P, 'children'> & {
    children?: JSXElement
  }
}
