import { flapDeep, isIterable, isPromise, MayPromise, omit, pipe } from '@edsolater/fnkit'
import { createElement, ReactElement, ReactNode, useState } from 'react'
import { handleDivPlugin } from '../plugins/handleDivPlugins'
import { handleDivChildren } from './handles/handleDivChildren'
import { handleDivShadowProps } from './handles/handleDivShallowProps'
import { handleDivTag } from './handles/handleDivTag'
import { DivChildNode, DivProps, HTMLTagMap } from './type'
import { parseDivPropsToCoreProps } from './utils/parseDivPropsToCoreProps'

export const Div = <TagName extends keyof HTMLTagMap = any>(rawProps: DivProps<TagName>) => {
  const props = pipe(
    rawProps as DivProps<TagName> | undefined,
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
  props: Omit<DivProps<any>, 'plugin' | 'tag' | 'shadowProps' | 'children'> & { children?: DivChildNode }
) {
  const children = useDivChildren(props.children)
  return createElement(props.as ?? 'div', parseDivPropsToCoreProps(props), children)
}

function useDangerousWrapperPluginsWithChildren(props: DivProps<any>): ReactElement {
  return flapDeep(props.dangerousRenderWrapperNode).reduce(
    (prevNode, getWrappedNode) => (getWrappedNode ? getWrappedNode(prevNode) : prevNode),
    createElement(Div, omit(props, 'dangerousRenderWrapperNode')) as ReactElement
  )
}

function useDivChildren(children: DivChildNode): ReactNode {
  const [cachedChildren, setCachedChildren]= useState(children as ReactNode)
  if (isPromise(children)) {
    
  }
  if (isIterable(children)) {
    
  }
  return cachedChildren
}
