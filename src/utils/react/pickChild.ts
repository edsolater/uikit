import { AnyFn, MayFn, shrinkToValue } from '@edsolater/fnkit'
import React, { isValidElement, ReactElement } from 'react'
import { DivChildNode } from '../../Div'
import { mergeProps } from '../../Div/utils/mergeProps'

type GetComponentProps<T extends (...args: any[]) => any> = Parameters<T>[0]
/** actually use Array.prototype.find()  */
export function pickChildByType<T extends AnyFn>(
  oldChildren: DivChildNode,
  targetType: T,
  additionalProps?: MayFn<GetComponentProps<T>, [oldProps: GetComponentProps<T>, oldNode: ReactElement<T>]>
) {
  // @ts-expect-error use pickChildByType is not a good idea!!!
  const children = React.Children.toArray(oldChildren)
  const child = children.find((child) => isValidElement(child) && child.type === targetType) as ReactElement<T> | null
  if (!child) return null
  if (!additionalProps) return child
  return React.cloneElement(child, mergeProps(child.props, shrinkToValue(additionalProps, [child.props, child])))
}
