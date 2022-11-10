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
  const mergedProps = mergeShallowProps(props)
  const isHTMLTag = isString(props.as) || isUndefined(props.as)
  const divRef = useRef<HTMLTagMap[TagName]>(null)

  // tag
  const hasNoRenderTag = hasTag(mergedProps.tag, noRenderTag)
  // TODO-improve DOM Cache
  if (hasNoRenderTag) return null

  const hasOffscreenTag = hasTag(mergedProps.tag, offscreenTag)

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
          ...(mergedProps.htmlProps && mergeProps(...shakeNil(flapDeep(mergedProps.htmlProps)))),
          className: [
            classname(mergedProps.className),
            parseCSS(mergedProps.icss),
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
            el && weakCacheInvoke(el, () => loadRef(mergeRefs(...flapDeep([mergedProps.domRef, divRef])), el)),
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

const noRenderTag = createDataTag({ key: 'Div', value: 'no-render' })
const offscreenTag = createDataTag({ key: 'Div', value: 'offscreen' })

Div.tag = {
  noRender: noRenderTag,
  offscreen: offscreenTag
}

function handleDivId(divProps) {}

export function mergeShallowProps<TagName extends keyof HTMLTagMap = 'div'>(
  props: DivProps<TagName> & _DivProps<TagName>
): DivProps<TagName> {
  const merged = shakeNil({
    ...props,
    children: props.children ?? props.children_,
    as: props.as ?? props.as_,

    classname: [props.className_, props.className],
    onClick: [props.onClick_, props.onClick],
    domRef: [props.domRef_, props.domRef],
    tag: [props.tag_, props.tag],
    style: [props.style_, props.style],
    icss: [props.icss_, props.icss],
    htmlProps: [props.htmlProps_, props.htmlProps]
  }) as DivProps<TagName>
  return merged
}
