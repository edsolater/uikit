import { MayDeepArray } from '@edsolater/fnkit'
import { JSXElement } from 'solid-js'
import { DivProps, HTMLTagMap } from '../Div/type'
import { ValidStatus } from '../typings/tools'

export type WithPlugins<Status extends ValidStatus = {}, TagName extends keyof HTMLTagMap = 'div'> = {
  plugin?: MayDeepArray<Plugin<any>>
}

export type WrapperNodeFn = (node: JSXElement) => JSXElement // change outter wrapper element

export type PluginCreateFn<T> = (props: T) => Partial<Omit<DivProps, 'plugin' | 'shadowProps'>>

export type Plugin<T> = {
  (additionalProps: Partial<T & DivProps>): Plugin<T>
  getProps?: (props: T & DivProps) => Partial<Omit<DivProps, 'plugin' | 'shadowProps'>>
  priority?: number // NOTE -1:  it should be calculated after final prop has determine
}
