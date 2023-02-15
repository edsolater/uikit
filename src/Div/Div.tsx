import { flapDeep, omit, pipe } from '@edsolater/fnkit'
import { createComponent, JSXElement } from 'solid-js'
import { handleDivPlugin } from '../plugins/handleDivPlugins'
import { handleDivShadowProps } from './handles/handleDivShallowProps'
import { handleDivTag } from './handles/handleDivTag'
import { DivChildNode, DivProps, HTMLTagMap } from './type'
import { parseDivPropsToCoreProps } from './utils/parseDivPropsToCoreProps'

export const Div = <TagName extends keyof HTMLTagMap = 'div'>(rawProps: DivProps<TagName>) => {
  const props = pipe(rawProps as Partial<DivProps>, handleDivShadowProps, handleDivPlugin, handleDivTag)
  if (!props) return null // just for type, logicly it will never happen

  // handle have return null
  return props.dangerousRenderWrapperNode ? handleDangerousWrapperPluginsWithChildren(props) : getNormalDivProps(props)
}

function getNormalDivProps(
  props: Omit<DivProps<keyof HTMLTagMap>, 'plugin' | 'tag' | 'shadowProps' | 'children'> & {
    children?: DivChildNode
  }
) {
  const children = props.children
  return <div {...parseDivPropsToCoreProps(props)}>{children}</div>
}

function handleDangerousWrapperPluginsWithChildren(props: DivProps): JSXElement {
  return flapDeep(props.dangerousRenderWrapperNode).reduce(
    (prevNode, getWrappedNode) => (getWrappedNode ? getWrappedNode(prevNode) : prevNode),
    createComponent(Div, omit(props, 'dangerousRenderWrapperNode'))
  )
}
