import { omit } from '@edsolater/fnkit'
import { DivProps } from '../Div/type'
import { dealWithPropPlugin } from './createPlugin'

export function handleDivPlugins<P extends Partial<DivProps<any>>>(props?: P): Omit<P, 'plugin'> | undefined {
  if (!props?.plugin) return props
  return omit(dealWithPropPlugin({ plugins: props.plugin, props }), 'plugin')
}
