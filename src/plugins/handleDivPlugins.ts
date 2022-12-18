import { flapDeep, omit } from '@edsolater/fnkit'
import { DivProps } from '../Div/type'
import { mergeProps } from '../functions/react'

export function handleDivPlugins<P extends Partial<DivProps<any>>>(props?: P): Omit<P, 'plugin'> | undefined {
  if (!props?.plugin) return props
  return omit(
    flapDeep(props.plugin).reduce((acc, { getAdditionalProps }) => mergeProps(acc, getAdditionalProps?.(acc)), props),
    'plugin'
  )
}
