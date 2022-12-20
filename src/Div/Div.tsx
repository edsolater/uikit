import { omit, pipe } from '@edsolater/fnkit'
import { createElement } from 'react'
import { dealWithDangerousWrapperPlugins } from '../plugins/createPlugin'
import { handleDivPlugins } from '../plugins/handleDivPlugins'
import { handleDivChildren } from './handles/handleDivChildren'
import { handleDivShadowProps } from './handles/handleDivShallowProps'
import { handleDivTag } from './handles/handleDivTag'
import { DivProps, HTMLTagMap } from './type'
import { parseDivPropsToCoreProps } from './utils/parseDivPropsToCoreProps'

export const Div = <TagName extends keyof HTMLTagMap = 'div'>(props: DivProps<TagName>) => {
  const mergedProps = pipe(props, handleDivShadowProps, handleDivPlugins, handleDivChildren, handleDivTag)
  if (!mergedProps) return null // handle have return null

  return mergedProps.dangerousRenderWrapperNode
    ? dealWithDangerousWrapperPlugins({
        innerNode: createElement(Div, omit(mergedProps, 'dangerousRenderWrapperNode')),
        dangerousRenderWrapperPlugin: mergedProps.dangerousRenderWrapperNode
      })
    : createElement(mergedProps.as ?? 'div', parseDivPropsToCoreProps(mergedProps), mergedProps.children)
}
