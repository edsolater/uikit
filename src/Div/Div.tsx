import { flapDeep, isString, isUndefined, merge, omit, pipe, shakeFalsy, shakeNil } from '@edsolater/fnkit'
import { createElement } from 'react'
import { invokeOnce } from '../functions/dom/invokeOnce'
import classname from '../functions/react/classname'
import mergeRefs, { loadRef } from '../functions/react/mergeRefs'
import { handleDivPropPlugins, handleDivWrapperPlugins, splitPropPlugins } from '../plugins/handleDivPlugins'
import { parseCSS } from '../styles/parseCSS'
import { DivProps, HTMLTagMap } from './type'
import { handleDivChildren } from './utils/handleDivChildren'
import { handleDivShallowProps } from './utils/handleDivShallowProps'
import { handleDivTag } from './utils/handleDivTag'

// TODO: as为组件时 的智能推断还不够好
export const Div = <TagName extends keyof HTMLTagMap = 'div'>(props: DivProps<TagName>) => {
  const { parsedProps: propsWithoutPlugins, getAdditionalPropsFuncs, wrappersNodeFuncs } = splitPropPlugins(props)

  // handle Kit() - like plugins
  if (wrappersNodeFuncs?.length)
    return handleDivWrapperPlugins(
      createElement(Div, handleDivPropPlugins(getAdditionalPropsFuncs)(propsWithoutPlugins) as DivProps<any>)
    )(wrappersNodeFuncs)

  const mergedProps = pipe(
    propsWithoutPlugins,
    handleDivShallowProps,
    handleDivPropPlugins(getAdditionalPropsFuncs),
    handleDivChildren,
    handleDivTag
  )

  if (!mergedProps) return null

  const isHTMLTag = isString(mergedProps.as) || isUndefined(mergedProps.as)

  const node = isHTMLTag
    ? createElement(
        (mergedProps.as ?? 'div') as string,
        {
          ...(mergedProps.htmlProps && Object.assign({}, ...flapDeep(mergedProps.htmlProps))),
          className:
            shakeFalsy([classname(mergedProps.className), parseCSS(mergedProps.icss)]).join(' ') ||
            undefined /* don't render if empty string */,
          ref: (el) => el && invokeOnce(el, () => loadRef(mergeRefs(...flapDeep(mergedProps.domRef)), el)),
          style: mergedProps.style ? merge(...flapDeep(shakeNil(mergedProps.style))) : undefined,
          onClick: mergedProps.onClick
            ? (ev) =>
                flapDeep([mergedProps.onClick]).map((onClick) => onClick?.({ event: ev, ev, el: ev.currentTarget }))
            : undefined
        } as any,
        mergedProps.children
      )
    : createElement(
        mergedProps.as as (...params: any[]) => JSX.Element,
        omit(mergedProps, ['as']),
        mergedProps.children
      )

  return node
}
