import { AnyFn, flap, MayFn, shakeNil, shrinkToValue } from '@edsolater/fnkit'
import React, { isValidElement, ReactElement } from 'react'
import { DivProps } from '../../Div'
import { GetComponentProps } from '../../typings/tools'
import { mergeProps } from '../../Div/utils/mergeProps'

/** actually use Array.prototype.find()  */
export function pickChildByType<T extends AnyFn>(
  oldChildren: DivProps['children'],
  targetType: T,
  additionalProps?: MayFn<GetComponentProps<T>, [oldProps: GetComponentProps<T>]>
) {
  const children = [oldChildren].flat()
  const child = children.find((child) => isValidElement(child) && child.type === targetType) as ReactElement<T> | null
  if (!child) return null
  if (!additionalProps) return child
  return React.cloneElement(child, mergeProps(child.props, shrinkToValue(additionalProps, [child.props])))
}

export function pickChildByTag<T extends AnyFn>(
  oldChildren: DivProps['children'],
  targetTag: string,
  additionalProps?: MayFn<GetComponentProps<T>, [oldProps: GetComponentProps<T>]>
) {
  const children = [oldChildren].flat()
  const child = children.find((child) => nodeHaveTag(child, targetTag)) as ReactElement<T> | null
  if (!child) return null
  if (!additionalProps) return child
  return React.cloneElement(child, mergeProps(child.props, shrinkToValue(additionalProps, [child.props])))
}

function nodeHaveTag(child: DivProps['children'], targetTag: string): boolean {
  return isValidElement(child) && (shakeNil(flap(child.props.tag)) as string[]).includes(targetTag)
}
