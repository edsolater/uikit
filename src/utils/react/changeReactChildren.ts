import { AnyFn, flap, MayArray, MayFn, shrinkToValue } from '@edsolater/fnkit'
import React, { isValidElement, ReactElement, ReactNode } from 'react'
import { mergeProps } from '../../Div/utils/mergeProps'

type GetComponentProps<T extends (...args: any[]) => any> = Parameters<T>[0]

type ConfigItem<T extends AnyFn> = {
  type: T
  props: MayFn<T, [oldProps: GetComponentProps<T>, oldNode: ReactElement<T>, index: number]>
}

/** will not pick or filter */
export function changeReactChildren<T extends AnyFn>(oldChildren: ReactNode, mergeConfig: [ConfigItem<T>])
export function changeReactChildren<T extends AnyFn, F extends AnyFn>(
  oldChildren: ReactNode,
  mergeConfig: [ConfigItem<T>, ConfigItem<F>]
)
export function changeReactChildren<T extends AnyFn, F extends AnyFn, W extends AnyFn>(
  oldChildren: ReactNode,
  mergeConfig: [ConfigItem<T>, ConfigItem<F>, ConfigItem<W>]
)
export function changeReactChildren<T extends AnyFn, F extends AnyFn, W extends AnyFn, U extends AnyFn>(
  oldChildren: ReactNode,
  mergeConfig: [ConfigItem<T>, ConfigItem<F>, ConfigItem<W>, ConfigItem<U>]
)
export function changeReactChildren<
  T extends AnyFn,
  F extends AnyFn,
  W extends AnyFn,
  U extends AnyFn,
  V extends AnyFn
>(oldChildren: ReactNode, mergeConfig: [ConfigItem<T>, ConfigItem<F>, ConfigItem<W>, ConfigItem<U>, ConfigItem<V>])
export function changeReactChildren(oldChildren: ReactNode, mergeConfig: ConfigItem<any>[])
export function changeReactChildren<T extends AnyFn>(oldChildren: ReactNode, mergeConfig: MayArray<ConfigItem<T>>) {
  return React.Children.map(oldChildren, (child, index) => {
    if (!isValidElement(child)) return child
    const mergeConfigs = flap(mergeConfig)
    const matchedConfig = mergeConfigs.find((config) => config.type === child.type)
    if (!matchedConfig) return child

    return React.cloneElement(
      child,
      mergeProps(child.props, shrinkToValue(matchedConfig.props, [child.props, child, index] as any))
    )
  })
}
