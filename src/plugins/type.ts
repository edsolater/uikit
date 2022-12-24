import { MayDeepArray } from '@edsolater/fnkit'
import { ReactElement } from 'react'
import { DivProps, HTMLTagMap } from '../Div/type'

export type WithPlugins<TagName extends keyof HTMLTagMap = any> = {
  plugin?: MayDeepArray<Plugx<DivProps>>
}

export type WrapperNodeFn = (node: ReactElement) => ReactElement // change outter wrapper element

export type PlugxCreateFn<T> = (props: T) => Partial<Omit<DivProps, 'plugin' | 'shadowProps'>>

export type Plugx<T> = {
  add(additionalProps: Partial<T & DivProps>): Plugx<T>
  getProps?: (props: T & DivProps) => Partial<Omit<DivProps, 'plugin' | 'shadowProps'>>
}
