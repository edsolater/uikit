import { mergeProps } from '@/foundation'
import type { ValidProps } from "./type"

/** use solidjs's mergeProps */
export function addDefaultProps<T extends ValidProps, const D>(
  props: T,
  defaultProps: D,
): Omit<T, keyof D> & Pick<Required<T>, keyof D & string> {
  return mergeProps(defaultProps, props) as any
}


