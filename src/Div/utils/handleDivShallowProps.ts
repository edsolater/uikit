import { mergeProps } from '../../functions/react'
import { DivProps } from '../type'

export function handleDivShallowProps<P extends Partial<DivProps<any>>>(props: P): Omit<P, 'shadowProps'> {
  if (!props.shadowProps) return props
  return mergeProps({ ...props, shadowProps: undefined }, handleDivShallowProps(props.shadowProps))
}
