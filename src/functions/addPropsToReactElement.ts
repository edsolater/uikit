import { MayFn, shrinkToValue } from '@edsolater/fnkit'
import { cloneElement, isValidElement } from 'react'
import { ReactNode } from 'react'
import { mergeProps } from './mergeProps'

export function addPropsToReactElement<AvailableProps = { [key: string]: any }>(
  element: any,
  props?: MayFn<Partial<AvailableProps> & { key?: number | string }, [oldprops: Partial<AvailableProps>]>
): ReactNode {
  if (!isValidElement(element)) return element
  return element ? cloneElement(element, mergeProps(element.props, shrinkToValue(props, [element.props as any]))) : null
}
