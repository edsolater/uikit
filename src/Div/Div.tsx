import { flapDeep, merge, omit, pipe, shakeFalsy, shakeNil } from '@edsolater/fnkit'
import { createElement } from 'react'
import { invokeOnce } from '../functions/dom/invokeOnce'
import classname from '../functions/react/classname'
import mergeRefs, { loadRef } from '../functions/react/mergeRefs'
import { handleDivPlugins, handleDivWrapperPlugins } from '../plugins/handleDivPlugins'
import { parseCSS } from '../styles/parseCSS'
import { DivProps, HTMLTagMap } from './type'
import { handleDivChildren } from './utils/handleDivChildren'
import { handleDivShallowProps } from './utils/handleDivShallowProps'
import { handleDivTag } from './utils/handleDivTag'

export const Div = <TagName extends keyof HTMLTagMap = 'div'>(props: DivProps<TagName>) => {
  const mergedProps = pipe(
    props,
    handleDivShallowProps,
    handleDivPlugins, // <-- FIXThis
    handleDivChildren,
    handleDivTag
  )

  if (mergedProps?.dangerousRenderWrapperNode) {
    const wrapperFns = flapDeep(mergedProps.dangerousRenderWrapperNode)
    return handleDivWrapperPlugins(createElement(Div, omit(mergedProps, 'dangerousRenderWrapperNode')))(wrapperFns)
  }

  return (
    mergedProps && createElement(mergedProps.as ?? 'div', parseDivPropsToCoreProps(mergedProps), mergedProps.children)
  )
}

function parseDivPropsToCoreProps(
  divProps: Omit<DivProps<any>, 'plugins' | 'tag' | 'shadowProps' | 'children'> & {
    children?: React.ReactNode
  }
) {
  return {
    ...(divProps.htmlProps && Object.assign({}, ...flapDeep(divProps.htmlProps))),
    className:
      shakeFalsy([classname(divProps.className), parseCSS(divProps.icss)]).join(' ') ||
      undefined /* don't render if empty string */,
    ref: (el) => el && invokeOnce(el, () => loadRef(mergeRefs(...flapDeep(divProps.domRef)), el)),
    style: divProps.style ? merge(...flapDeep(shakeNil(divProps.style))) : undefined,
    onClick: divProps.onClick
      ? (ev) => flapDeep([divProps.onClick]).map((onClick) => onClick?.({ event: ev, ev, el: ev.currentTarget }))
      : undefined
  }
}
