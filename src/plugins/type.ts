import { MayArray, MayDeepArray } from '@edsolater/fnkit'
import { ReactElement } from 'react'
import { DivProps, HTMLTagMap } from '../Div/type'

export type WithPlugins<TagName extends keyof HTMLTagMap = 'div'> = {
  plugins?: MayDeepArray<AbilityPlugin<TagName>>
}

export type WrapperNodeFn = (node: ReactElement) => ReactElement // change outter wrapper element

export type AbilityPlugin<TagName extends keyof HTMLTagMap = 'div'> = {
  getAdditionalProps?: (props: DivProps) => Partial<Omit<DivProps<TagName>, 'plugins' | 'shadowProps'>> // change inner props
}
