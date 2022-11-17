import { useHover, UseHoverOptions } from '@edsolater/hookit'
import { useRef } from 'react'
import { AbilityPlugin } from './type'

export type HoverPluginOptions = UseHoverOptions

export const hoverPlugin = (options: HoverPluginOptions) => {
  const divRef = useRef<any>(null)
  useHover(divRef, options)
  return { additionalProps: { domRef: divRef } } as AbilityPlugin
}
