import { MayArray } from '@edsolater/fnkit'
import { DivProps, HTMLTagMap } from '../type'

export type WithPlugins<TagName extends keyof HTMLTagMap = 'div'> = {
  plugins?: MayArray<AbilityPlugin<TagName>>
}

export type AbilityPlugin<TagName extends keyof HTMLTagMap = 'div'> = {
  additionalProps: Partial<Omit<DivProps<TagName>, 'plugins' | 'shadowProps'>>
}

export type AbilityPluginFactoryFn = (...args: any[]) => AbilityPlugin // should use this when ts `satisfies` keyword is ready
