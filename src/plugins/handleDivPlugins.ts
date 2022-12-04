import { flap, groupBy, omit } from '@edsolater/fnkit'
import { ReactElement } from 'react'
import { mergeProps } from '../functions/react'
import { DivProps } from '../Div/type'
import { AbilityNormalPlugins, AbilityWrapperPlugins } from './type'

export const handleDivNormalPlugins =
  (normalPlugins: AbilityNormalPlugins[]) =>
  <P extends Partial<DivProps<any>>>(props: P): P =>
    (normalPlugins ?? []).reduce((acc, plugin) => mergeProps(acc, plugin.additionalProps()), props)

export const handleDivWrapperPlugins =
  (node: ReactElement) =>
  (wrapperPlugins: AbilityWrapperPlugins[]): ReactElement =>
    (wrapperPlugins ?? []).reduce((prevNode, { getWrappedNode }) => getWrappedNode(prevNode), node)

export function splitPropPlugins<P extends Partial<DivProps<any>>>(
  props: P
): {
  props: Omit<P, 'plugins'>
  normalPlugins: AbilityNormalPlugins[]
  wrapperPlugins: AbilityWrapperPlugins[]
} {
  if (!props.plugins) return { props: props, normalPlugins: [], wrapperPlugins: [] }
  const { false: normalPlugin, true: outsideWrapperPlugin } = groupBy(flap(props.plugins), (p) =>
    String(p.isOutsideWrapperNode)
  )
  return {
    props: omit(props, 'plugins'),
    normalPlugins: normalPlugin as AbilityNormalPlugins[],
    wrapperPlugins: outsideWrapperPlugin as AbilityWrapperPlugins[]
  }
}
