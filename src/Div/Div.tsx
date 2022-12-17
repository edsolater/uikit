import { flapDeep, merge, pipe, shakeFalsy, shakeNil } from '@edsolater/fnkit'
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
  return createElement(mergedProps.as ?? 'div', parseDivPropsToCoreProps(mergedProps), mergedProps.children)
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
