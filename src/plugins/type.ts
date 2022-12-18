import { MayDeepArray } from '@edsolater/fnkit'
import { ReactElement } from 'react'
import { DivProps, HTMLTagMap } from '../Div/type'

export type WithPlugins<TagName extends keyof HTMLTagMap = 'div'> = {
  plugins?: MayDeepArray<AbilityPlugin<DivProps<TagName>>>
}

export type WrapperNodeFn = (node: ReactElement) => ReactElement // change outter wrapper element

export type AbilityPlugin<P extends DivProps<any> = DivProps> = {
  getAdditionalProps?: (props: DivProps) => Partial<Omit<P, 'plugins' | 'shadowProps'>> // change inner props
}
