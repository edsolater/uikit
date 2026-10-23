import { mergeProps } from '@/foundation'
import type { ValidProps } from './type'

/** 合并默认属性，显式 undefined 继续使用对应默认值。 */
export function addDefaultProps<T extends ValidProps, const D>(
  props: T,
  defaultProps: D,
): Omit<T, keyof D> & Pick<Required<T>, keyof D & string> {
  return mergeProps(defaultProps, props) as any
}
