import { omit } from '@edsolater/fnkit'
import { DivProps } from '../Div/type'
import { parsePropPluginToProps } from './createPlugin'

export function handleDivPlugin<P extends Partial<DivProps>>(props: P) {
  if (!props?.plugin) return props
  return omit(parsePropPluginToProps({ plugin: props.plugin, props }), 'plugin')
}

