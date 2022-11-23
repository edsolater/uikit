import { flapDeep } from '@edsolater/fnkit'
import { DivProps } from '../type'
import { mergeProps } from './mergeProps'

export function handleDivPropHook<P extends Partial<DivProps<any>>>(props?: P): Omit<P, 'propHook'> | undefined {
  if (!props?.propHook) return props
  return flapDeep(props.propHook).reduce((acc, propHook) => mergeProps(acc, propHook(props)), props)
}
