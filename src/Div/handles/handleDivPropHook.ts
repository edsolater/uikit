import { flapDeep } from '@edsolater/fnkit'
import { DivProps } from '../type'
import { mergeProps } from '../utils/mergeProps'

/** @deprecated TODO prop hook should just be a normal plugin */
// export function handleDivPropHook<P extends Partial<DivProps<any>>>(props?: P): Omit<P, 'propHook'> | undefined {
//   if (!props?.propHook) return props
//   return flapDeep(props.propHook).reduce((acc, propHook) => mergeProps(acc, propHook(props)), props)
// }
