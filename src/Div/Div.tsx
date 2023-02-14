import { flapDeep, omit, pipe } from '@edsolater/fnkit'
import { createComponent } from 'solid-js'
import { handleDivPlugin } from '../plugins/handleDivPlugins'
import { ValidStatus } from '../typings/tools'
import { handleDivChildren } from './handles/handleDivChildren'
import { handleDivShadowProps } from './handles/handleDivShallowProps'
import { handleDivTag } from './handles/handleDivTag'
import { useDivChildren } from './hooks/useDivChildren'
import { DivChildNode, DivProps, HTMLTagMap } from './type'
import { parseDivPropsToCoreProps } from './utils/parseDivPropsToCoreProps'

export const Div = <Status extends ValidStatus = {}, TagName extends keyof HTMLTagMap = 'div'>(
  rawProps: DivProps<Status, TagName>
) => {
  const props = pipe(
    rawProps as Partial<DivProps>,
    handleDivShadowProps,
    handleDivPlugin,
    (p) => handleDivChildren(p, rawProps._status),
    handleDivTag
  )
  if (!props) return null // just for type, logicly it will never happen

  // handle have return null
  return props.dangerousRenderWrapperNode
    ? useDangerousWrapperPluginsWithChildren(props)
    : (useNormalDivPropsWithChildren(props) as unknown as JSX.Element)
}

function useNormalDivPropsWithChildren(
  props: Omit<DivProps<ValidStatus, keyof HTMLTagMap>, 'plugin' | 'tag' | 'shadowProps' | 'children'> & {
    children?: DivChildNode
  }
) {
  const children = useDivChildren(props.children)
  return <div {...parseDivPropsToCoreProps(props)}>{children}</div>
}

function useDangerousWrapperPluginsWithChildren(props: DivProps) {
  return flapDeep(props.dangerousRenderWrapperNode).reduce(
    (prevNode, getWrappedNode) => (getWrappedNode ? getWrappedNode(prevNode) : prevNode),
    createComponent(Div, omit(props, 'dangerousRenderWrapperNode'))
  )
}
