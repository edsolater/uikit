import { MayArray } from '@edsolater/fnkit'
import { ReactElement } from 'react'
import { DivProps, HTMLTagMap } from '../Div/type'

export type WithPlugins<TagName extends keyof HTMLTagMap = 'div'> = {
  plugins?: MayArray<AbilityPlugin<TagName>>
}

export type AbilityPlugin<TagName extends keyof HTMLTagMap = 'div'> = {
  additionalProps?: (props: DivProps) => Partial<Omit<DivProps<TagName>, 'plugins' | 'shadowProps'>>
  getWrappedNode?: (node: ReactElement) => ReactElement
}
