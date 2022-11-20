import { MayArray } from '@edsolater/fnkit'
import { ReactElement } from 'react'
import { DivProps, HTMLTagMap } from '../type'

export type WithPlugins<TagName extends keyof HTMLTagMap = 'div'> = {
  plugins?: MayArray<AbilityPlugin<TagName>>
}

export type AbilityNormalPlugins<TagName extends keyof HTMLTagMap = 'div'> = {
  isOutsideWrapperNode: false
  additionalProps: Partial<Omit<DivProps<TagName>, 'plugins' | 'shadowProps'>>
}

export type AbilityWrapperPlugins = {
  isOutsideWrapperNode: true
  getWrappedNode: (node: ReactElement) => ReactElement
}

export type AbilityPlugin<TagName extends keyof HTMLTagMap = 'div'> =
  | AbilityNormalPlugins<TagName>
  | AbilityWrapperPlugins

export type AbilityPluginFactoryFn = (...args: any[]) => AbilityPlugin // should use this when ts `satisfies` keyword is ready
