import { flapDeep, omit, pipe } from '@edsolater/fnkit'
import { createElement, ReactElement } from 'react'
import { handleDivPlugins } from '../plugins/handleDivPlugins'
import { handleDivChildren } from './handles/handleDivChildren'
import { handleDivShadowProps } from './handles/handleDivShallowProps'
import { handleDivTag } from './handles/handleDivTag'
import { DivProps, HTMLTagMap } from './type'
import { parseDivPropsToCoreProps } from './utils/parseDivPropsToCoreProps'

export const Div = <TagName extends keyof HTMLTagMap = 'div'>(rawProps: DivProps<TagName>) => {
  const props = pipe(rawProps, handleDivShadowProps, handleDivPlugins, handleDivChildren, handleDivTag)
  if (!props) return null 
  
  // handle have return null
  return props.dangerousRenderWrapperNode ? dealWithDangerousWrapperPlugins(props) : dealWithDivProps(props)
}

function dealWithDivProps(
  props: Omit<DivProps<any>, 'plugin' | 'tag' | 'shadowProps' | 'children'> & { children?: React.ReactNode }
) {
  return createElement(props.as ?? 'div', parseDivPropsToCoreProps(props), props.children)
}

function dealWithDangerousWrapperPlugins(props: DivProps<any>): ReactElement {
  return flapDeep(props.dangerousRenderWrapperNode).reduce(
    (prevNode, getWrappedNode) => (getWrappedNode ? getWrappedNode(prevNode) : prevNode),
    createElement(Div, omit(props, 'dangerousRenderWrapperNode')) as ReactElement
  )
}
