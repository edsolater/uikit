import { mergeProps } from '../../Div/utils/mergeProps'

// NOTE: seems not necessary. But, it can improve code's readability
export default function addDefaultProps<T>(props: T, defaultProps: Partial<T>): T {
  return mergeProps(defaultProps, props)
}
