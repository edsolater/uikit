import { MayDeepArray } from '@edsolater/fnkit'
import { ReactElement } from 'react'
import { DivProps, HTMLTagMap } from '../Div/type'

export type WithPlugins<TagName extends keyof HTMLTagMap = any> = {
  plugin?: MayDeepArray<Plugin<DivProps>>
}

export type WrapperNodeFn = (node: ReactElement) => ReactElement // change outter wrapper element

export type PluginCreateFn<T> = (props: T) => Partial<Omit<DivProps, 'plugin' | 'shadowProps'>>

export type Plugin<T> = {
  (additionalProps: Partial<T & DivProps>): Plugin<T>
  getProps?: (props: T & DivProps) => Partial<Omit<DivProps, 'plugin' | 'shadowProps'>>
}
