import { flapDeep, omit, pipe } from '@edsolater/fnkit'
import { createElement, ReactElement } from 'react'
import { handleDivPlugin } from '../plugins/handleDivPlugins'
import { ValidStatus } from '../typings/tools'
import { handleDivChildren } from './handles/handleDivChildren'
import { handleDivShadowProps } from './handles/handleDivShallowProps'
import { handleDivTag } from './handles/handleDivTag'
import { useDivChildren } from './hooks/useDivChildren'
import { DivChildNode, DivProps, HTMLTagMap, Status } from './type'
import { parseDivPropsToCoreProps } from './utils/parseDivPropsToCoreProps'

export const Div = <TagName extends keyof HTMLTagMap = 'div'>(rawProps: DivProps<TagName>) => {
  const props = pipe(
    rawProps as Partial<DivProps>,
    handleDivShadowProps,
    handleDivPlugin,
    handleDivChildren,
    handleDivTag
  )
  if (!props) return null // just for type, logicly it will never happen

  // handle have return null
  return props.dangerousRenderWrapperNode
    ? useDangerousWrapperPluginsWithChildren(props)
    : useNormalDivPropsWithChildren(props)
}

function useNormalDivPropsWithChildren(
  props: Omit<DivProps< keyof HTMLTagMap>, 'plugin' | 'tag' | 'shadowProps' | 'children'> & {
    children?: DivChildNode
  }
) {
  const children = useDivChildren(props.children)
  return createElement(props.as ?? 'div', parseDivPropsToCoreProps(props), children)
}

function useDangerousWrapperPluginsWithChildren(props: DivProps): ReactElement {
  return flapDeep(props.dangerousRenderWrapperNode).reduce(
    (prevNode, getWrappedNode) => (getWrappedNode ? getWrappedNode(prevNode) : prevNode),
    createElement(Div, omit(props, 'dangerousRenderWrapperNode') as any) as ReactElement
  )
}
