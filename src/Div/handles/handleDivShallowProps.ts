import { flapDeep } from '@edsolater/fnkit'
import { DivProps } from '../type'
import { mergeProps } from '../utils/mergeProps'

export function handleDivShadowProps<P extends Partial<DivProps>>(props: P): Omit<P, 'shadowProps'> {
  if (!props?.shadowProps) return props
  return mergeProps({ ...props, shadowProps: undefined }, ...flapDeep(props.shadowProps)) as Omit<P, 'shadowProps'>
}
