import { MayArray } from '@edsolater/fnkit'
import { ReactElement } from 'react'
import { DivProps, HTMLTagMap } from '../Div/type'

export type WithPlugins<TagName extends keyof HTMLTagMap = 'div'> = {
  plugins?: MayArray<AbilityPlugin<TagName>>
}

export type AbilityPlugin<TagName extends keyof HTMLTagMap = 'div'> = {
  getAdditionalProps?: (props: DivProps) => Partial<Omit<DivProps<TagName>, 'plugins' | 'shadowProps'>> // change inner props
  getWrappedNode?: (node: ReactElement) => ReactElement // change outter wrapper element 
}
