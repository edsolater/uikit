import { flapDeep, omit } from '@edsolater/fnkit'
import { DivProps } from '../Div/type'
import { mergeProps } from '../functions/react'

export function handleDivPlugins<P extends Partial<DivProps<any>>>(props?: P): Omit<P, 'plugins'> | undefined {
  if (!props?.plugins) return props
  return omit(
    flapDeep(props.plugins).reduce((acc, { getAdditionalProps }) => mergeProps(acc, getAdditionalProps?.(acc)), props),
    'plugins'
  )
}
