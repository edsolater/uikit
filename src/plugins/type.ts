import { MayDeepArray } from '@edsolater/fnkit'
import { ReactElement } from 'react'
import { DivProps, HTMLTagMap } from '../Div/type'

export type WithPlugins<TagName extends keyof HTMLTagMap = 'div'> = {
  plugin?: PluginAtoms<DivProps<TagName>>
}

export type WrapperNodeFn = (node: ReactElement) => ReactElement // change outter wrapper element

export type PluginAtom<P extends DivProps<any> = DivProps> = {
  getAdditionalProps?: (props: DivProps) => Partial<Omit<P, 'plugin' | 'shadowProps'>> // change inner props
}

export type PluginAtoms<T extends DivProps<any> = DivProps> = MayDeepArray<PluginAtom<T>>

export type PluginFunction<Params extends unknown[] = unknown[], P extends DivProps<any> = DivProps> = (
  ...args: Params
) => PluginAtom<P>
