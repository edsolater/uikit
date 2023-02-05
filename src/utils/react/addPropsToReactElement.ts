import { MayFn, shrinkToValue } from '@edsolater/fnkit'
import { cloneElement, isValidElement } from 'react'
import { ReactNode } from 'react'
import { mergeProps } from '../../Div/utils/mergeProps'

export function addPropsToReactElement<AvailableProps = { [key: string]: any }>(
  element: any,
  props?: MayFn<Partial<AvailableProps> & { key?: number | string }, [oldprops: Partial<AvailableProps>]>,
  options?: {}
): ReactNode {
  if (!isValidElement(element)) return element
  const newProps = mergeProps(shrinkToValue(props, [element.props as any]), element.props)
  return cloneElement(element, newProps as any)
}
