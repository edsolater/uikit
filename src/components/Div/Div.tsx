import { createElement, useRef } from 'react'

import { flapDeep, isString, isUndefined, merge, omit, shakeNil } from '@edsolater/fnkit'

import { useHover } from '@edsolater/hookit'
import { weakCacheInvoke } from '../../functions/dom/weakCacheInvoke'
import { mergeProps } from '../../functions/react'
import classname from '../../functions/react/classname'
import mergeRefs, { loadRef } from '../../functions/react/mergeRefs'
import { parseCSS } from '../../styles/parseCSS'
import { createDataTag, hasTag, toDataset } from './tag'
import { DivProps, HTMLTagMap, _DivProps } from './type'
export * from './type'

// TODO: as为组件时 的智能推断还不够好
export const Div = <TagName extends keyof HTMLTagMap = 'div'>(props: DivProps<TagName> & _DivProps<TagName>) => {
  const isHTMLTag = isString(props.as) || isUndefined(props.as)
  const divRef = useRef<HTMLTagMap[TagName]>(null)

  // tag
  const hasNoRenderTag = hasTag(props.tag, noRenderTag) || hasTag(props.tag_, noRenderTag)

  // TODO-improve DOM Cache
  if (hasNoRenderTag) return null

  const hasOffscreenTag = hasTag(props.tag, offscreenTag) || hasTag(props.tag_, offscreenTag)

  // gesture handler (stable props)
  if ('onHover' in props || 'onHoverStart' in props || 'onHoverEnd' in props || 'triggerDelay' in props) {
    useHover(divRef, props)
  }

  return isHTMLTag
    ? createElement(
        // @ts-expect-error assume a function return ReactNode is a Component
        props.as ?? props.as_ ?? 'div',
        {
          ...((props.htmlProps || props.htmlProps_) &&
            mergeProps(...shakeNil(flapDeep([props.htmlProps_, props.htmlProps])))),
          className: [
            classname(props.className_),
            classname(props.className),
            parseCSS(props.icss_),
            parseCSS(props.icss),
            hasOffscreenTag && {
              position: 'absolute',
              top: -9999,
              left: -9999,
              pointerEvents: 'none',
              visibility: 'hidden'
            }
          ]
            .filter(Boolean)
            .join(' '),
          ref: (el) =>
            el && weakCacheInvoke(el, () => loadRef(mergeRefs(...flapDeep([props.domRef_, props.domRef, divRef])), el)),
          style: props.style || props.style_ ? merge(...flapDeep(shakeNil([props.style_, props.style]))) : undefined,
          onClick:
            props.onClick || props.onClick_
              ? (ev) =>
                  flapDeep([props.onClick_, props.onClick]).map((onClick) =>
                    onClick?.({ event: ev, ev, el: ev.currentTarget })
                  )
              : undefined,
          ...toDataset(props.tag, props.tag_)
        },
        props.children ?? (props.children_ as any)
      )
    : createElement(
        // @ts-expect-error assume a function return ReactNode is a Component
        props.as ?? props.as_,
        omit(props, ['as', 'as_']),
        props.children ?? props.children_
      )
}

const noRenderTag = createDataTag({ key: 'Div', value: 'no-render' })
const offscreenTag = createDataTag({ key: 'Div', value: 'offscreen' })
Div.tag = {
  noRender: noRenderTag,
  offscreen: offscreenTag
}
