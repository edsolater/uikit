import { createElement, useRef } from 'react'

import { flapDeep, isString, isUndefined, merge, omit, shakeNil } from '@edsolater/fnkit'

import { useHover } from '@edsolater/hookit'
import { weakCacheInvoke as invokeOnce } from '../../functions/dom/weakCacheInvoke'
import { mergeProps } from '../../functions/react'
import classname from '../../functions/react/classname'
import mergeRefs, { loadRef } from '../../functions/react/mergeRefs'
import { parseCSS } from '../../styles/parseCSS'
import { DivProps, HTMLTagMap, ShallowDivProps, _DivProps } from './type'
import { handleDivTag } from './utils/handleDivTag'
import { mergeShallowProps } from './utils/mergeShallowProps'
import { toDataset } from './utils/tag'

// TODO: as为组件时 的智能推断还不够好
export const Div = <TagName extends keyof HTMLTagMap = 'div'>(props: DivProps<TagName> & _DivProps<TagName> & ShallowDivProps<TagName>) => {
  const mergedProps = handleDivTag(mergeShallowProps(props))
  if (!mergedProps) return null
  const isHTMLTag = isString(mergedProps.as) || isUndefined(mergedProps.as)
  const divRef = useRef<HTMLTagMap[TagName]>(null)

  // gesture handler (stable mergedProps)
  if (
    'onHover' in mergedProps ||
    'onHoverStart' in mergedProps ||
    'onHoverEnd' in mergedProps ||
    'triggerDelay' in mergedProps
  ) {
    useHover(divRef, mergedProps)
  }

  return isHTMLTag
    ? createElement(
        // @ts-expect-error assume a function return ReactNode is a Component
        mergedProps.as ?? 'div',
        {
          ...(mergedProps.htmlProps && mergeProps(...flapDeep(mergedProps.htmlProps))),
          className: shakeNil([classname(mergedProps.className), parseCSS(mergedProps.icss)]).join(' '),
          ref: (el) => el && invokeOnce(el, () => loadRef(mergeRefs(...flapDeep([mergedProps.domRef, divRef])), el)),
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
        // @ts-expect-error assume a function return ReactNode is a Component
        mergedProps.as,
        omit(mergedProps, ['as']),
        mergedProps.children
      )
}
