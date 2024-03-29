import { AnyFn, flap, MayFn, shakeNil, shrinkToValue } from '@edsolater/fnkit'
import React, { isValidElement, ReactElement, ReactNode } from 'react'
import { mergeProps } from '../../Div/utils/mergeProps'

type GetComponentProps<T extends (...args: any[]) => any> = Parameters<T>[0]
/** actually use Array.prototype.find()  */
export function pickChildByType<T extends AnyFn>(
  oldChildren: ReactNode,
  targetType: T,
  additionalProps?: MayFn<GetComponentProps<T>, [oldProps: GetComponentProps<T>, oldNode: ReactElement<T>]>
) {
  const children = React.Children.toArray(oldChildren)
  const child = children.find((child) => isValidElement(child) && child.type === targetType) as ReactElement<T> | null
  if (!child) return null
  if (!additionalProps) return child
  return React.cloneElement(child, mergeProps(child.props, shrinkToValue(additionalProps, [child.props, child])))
}
export function pickChildByTag<T extends AnyFn>(
  oldChildren: ReactNode,
  targetTag: string,
  additionalProps?: MayFn<GetComponentProps<T>, [oldProps: GetComponentProps<T>, oldNode: ReactElement<T>]>
) {
  const children = React.Children.toArray(oldChildren)
  const child = children.find((child) => nodeHaveTag(child, targetTag)) as ReactElement<T> | null
  if (!child) return null
  if (!additionalProps) return child
  return React.cloneElement(child, mergeProps(child.props, shrinkToValue(additionalProps, [child.props, child])))
}

function nodeHaveTag(child: ReactNode, targetTag: string): boolean {
  return isValidElement(child) && (shakeNil(flap(child.props.tag, child.props.tag_)) as string[]).includes(targetTag)
}
