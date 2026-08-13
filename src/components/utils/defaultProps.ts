import { mergeProps as solidjsMergeProps } from "solid-js"
import type { ValidProps } from "./type"

/** use solidjs's mergeProps */
export function addDefaultProps<T extends ValidProps, const D>(
  props: T,
  defaultProps: D,
): Omit<T, keyof D> & Pick<Required<T>, keyof D & string> {
  return solidjsMergeProps(defaultProps, props) as any
}


