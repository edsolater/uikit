import { createElement } from 'react'

import { flapDeep, isString, isUndefined, merge, omit, shakeFalsy, shakeNil } from '@edsolater/fnkit'

import { weakCacheInvoke as invokeOnce } from '../../functions/dom/weakCacheInvoke'
import { mergeProps } from '../../functions/react'
import classname from '../../functions/react/classname'
import mergeRefs, { loadRef } from '../../functions/react/mergeRefs'
import { parseCSS } from '../../styles/parseCSS'
import { DivProps, HTMLTagMap, ShallowDivProps, _DivProps } from './type'
import { handleDivTag } from './utils/handleDivTag'
import { mergeShallowProps } from './utils/mergeShallowProps'
import { toDataset } from './utils/tag'
import { parseDivChildren } from './utils/parseDivChildren'
import { handlerDivHover } from './utils/handlerDivHover'

// TODO: as为组件时 的智能推断还不够好
export const Div = <TagName extends keyof HTMLTagMap = 'div'>(
  props: DivProps<TagName> & _DivProps<TagName> & ShallowDivProps<TagName>
) => {
  const mergedProps = handlerDivHover(handleDivTag(mergeShallowProps(props)))
  if (!mergedProps) return null
  const isHTMLTag = isString(mergedProps.as) || isUndefined(mergedProps.as)
  return isHTMLTag
    ? createElement(
        // @ts-expect-error assume a function return ReactNode is a Component
        mergedProps.as ?? 'div',
        {
          ...(mergedProps.htmlProps && mergeProps(...flapDeep(mergedProps.htmlProps))),
          className:
            shakeFalsy([classname(mergedProps.className), parseCSS(mergedProps.icss)]).join(' ') ||
            undefined /* don't render if empty string */,
          ref: (el) => el && invokeOnce(el, () => loadRef(mergeRefs(...flapDeep(mergedProps.domRef)), el)),
          style: mergedProps.style ? merge(...flapDeep(shakeNil(mergedProps.style))) : undefined,
          onClick: mergedProps.onClick
            ? (ev) =>
                flapDeep([mergedProps.onClick]).map((onClick) => onClick?.({ event: ev, ev, el: ev.currentTarget }))
            : undefined,
          ...toDataset(mergedProps.tag)
        },
        parseDivChildren(mergedProps.children)
      )
    : createElement(
        // @ts-expect-error assume a function return ReactNode is a Component
        mergedProps.as,
        omit(mergedProps, ['as']),
        parseDivChildren(mergedProps.children)
      )
}
