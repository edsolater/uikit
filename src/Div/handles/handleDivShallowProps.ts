import { flapDeep } from '@edsolater/fnkit'
import { mergeProps } from '../../functions/react'
import { DivProps } from '../type'

export function handleDivShadowProps<P extends Partial<DivProps<any>>>(props?: P): Omit<P, 'shadowProps'> | undefined {
  if (!props?.shadowProps) return props
  return mergeProps({ ...props, shadowProps: undefined }, ...flapDeep(props.shadowProps)) as Omit<P, 'shadowProps'>
}
