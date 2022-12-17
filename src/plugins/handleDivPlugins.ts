import { flapDeep, omit } from '@edsolater/fnkit'
import { ReactElement } from 'react'
import { DivProps } from '../Div/type'
import { mergeProps } from '../functions/react'
import { WrapperNodeFn } from './type'

export const handleDivWrapperPlugins =
  (orginalCoreNode: ReactElement) =>
  (plugins: WrapperNodeFn[]): ReactElement =>
    plugins.reduce((prevNode, getWrappedNode) => getWrappedNode(prevNode), orginalCoreNode)

export function handleDivPlugins<P extends Partial<DivProps<any>>>(props?: P): Omit<P, 'plugins'> | undefined {
  if (!props?.plugins) return props
  return omit(
    flapDeep(props.plugins).reduce(
      (acc, { getAdditionalProps }) => mergeProps(acc, getAdditionalProps?.(acc)),
      props
    ),
    'plugins'
  )
}
