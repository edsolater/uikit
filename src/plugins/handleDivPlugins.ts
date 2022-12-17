import { flapDeep, omit } from '@edsolater/fnkit'
import { ReactElement } from 'react'
import { DivProps } from '../Div/type'
import { mergeProps } from '../functions/react'
import { AbilityPlugin } from './type'

export const handleDivPropPlugins =
  (plugins: NonNullable<AbilityPlugin['getAdditionalProps']>[]) =>
  <P extends Partial<DivProps<any>>>(props: P): P =>
    plugins.reduce((acc, additionalProps) => mergeProps(acc, additionalProps(acc)), props)

export const handleDivWrapperPlugins =
  (node: ReactElement) =>
  (plugins: NonNullable<AbilityPlugin['getWrappedNode']>[]): ReactElement =>
    plugins.reduce((prevNode, getWrappedNode) => getWrappedNode(prevNode), node)

export function splitPropPlugins<P extends Partial<DivProps<any>>>(
  props: P
): {
  parsedProps: Omit<P, 'plugins'>
  getAdditionalPropsFuncs: NonNullable<AbilityPlugin['getAdditionalProps']>[]
  wrappersNodeFuncs: NonNullable<AbilityPlugin['getWrappedNode']>[]
} {
  if (!props.plugins) return { parsedProps: props, getAdditionalPropsFuncs: [], wrappersNodeFuncs: [] }
  const { additionalProps, wrappers } = flapDeep(props.plugins).reduce(
    (acc, { getAdditionalProps, getWrappedNode }) => ({
      additionalProps: getAdditionalProps ? [...acc.additionalProps, getAdditionalProps] : acc.additionalProps,
      wrappers: getWrappedNode ? [...acc.wrappers, getWrappedNode] : acc.wrappers
    }),
    {
      additionalProps: [] as NonNullable<AbilityPlugin['getAdditionalProps']>[],
      wrappers: [] as NonNullable<AbilityPlugin['getWrappedNode']>[]
    }
  )
  return {
    parsedProps: omit(props, 'plugins'),
    getAdditionalPropsFuncs: additionalProps,
    wrappersNodeFuncs: wrappers
  }
}
