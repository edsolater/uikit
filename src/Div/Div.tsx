import { flapDeep, omit, pipe } from '@edsolater/fnkit'
import { createElement } from 'react'
import { handleDivPlugins } from '../plugins/handleDivPlugins'
import { DivProps, HTMLTagMap } from './type'
import { handleDivChildren } from './handles/handleDivChildren'
import { handleDivShadowProps } from './handles/handleDivShallowProps'
import { handleDivTag } from './handles/handleDivTag'
import { handleDivWrapperPlugins } from './utils/handleDivWrapperPlugins'
import { parseDivPropsToCoreProps } from './utils/parseDivPropsToCoreProps'

export const Div = <TagName extends keyof HTMLTagMap = 'div'>(props: DivProps<TagName>) => {
  const mergedProps = pipe(props, handleDivShadowProps, handleDivPlugins, handleDivChildren, handleDivTag)
  if (!mergedProps) return null // handle have return null

  return mergedProps.dangerousRenderWrapperNode
    ? handleDivWrapperPlugins({
        innerNode: createElement(Div, omit(mergedProps, 'dangerousRenderWrapperNode')),
        plugin: flapDeep(mergedProps.dangerousRenderWrapperNode)
      })
    : createElement(mergedProps.as ?? 'div', parseDivPropsToCoreProps(mergedProps), mergedProps.children)
}
