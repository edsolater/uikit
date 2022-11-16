import { createElement } from 'react'

import { flapDeep, isString, isUndefined, merge, omit, pipeHandlers, shakeFalsy, shakeNil } from '@edsolater/fnkit'

import { weakCacheInvoke as invokeOnce } from '../../functions/dom/weakCacheInvoke'
import { mergeProps } from '../../functions/react'
import classname from '../../functions/react/classname'
import mergeRefs, { loadRef } from '../../functions/react/mergeRefs'
import { parseCSS } from '../../styles/parseCSS'
import { DivProps, HTMLTagMap } from './type'
import { handleDivTag } from './utils/handleDivTag'
import { collapseShallowProps } from './utils/collapseShallowProps'
import { toDataset } from './utils/tag'
import { handleDivChildren } from './utils/handleDivChildren'
import { handleDivHover } from './utils/handleDivHover'

// TODO: as为组件时 的智能推断还不够好
export const Div = <TagName extends keyof HTMLTagMap = 'div'>(props: DivProps<TagName>) => {
  const mergedProps = pipeHandlers(props, collapseShallowProps, handleDivChildren, handleDivTag, handleDivHover)
  if (!mergedProps) return null
  const isHTMLTag = isString(mergedProps.as) || isUndefined(mergedProps.as)
  return isHTMLTag
    ? createElement(
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
        mergedProps.children
      )
    : createElement(
        mergedProps.as,
        omit(mergedProps, ['as']),
        mergedProps.children
      )
}
