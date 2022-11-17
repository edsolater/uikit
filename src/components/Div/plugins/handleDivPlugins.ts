import { mergeProps } from '../../../functions/react'
import { DivProps } from '../type'

export function handleDivPlugins<P extends Partial<DivProps<any>>>(props: P): Omit<P, 'plugins'> {
  if (!props.plugins) return props
  const trimed = { ...props, plugins: undefined }
  return props.plugins?.reduce((acc, plugin) => mergeProps(acc, plugin.additionalProps), trimed) as Omit<P, 'plugins'>
}
