import { createElement, MutableRefObject, ReactHTML, ReactNode, useRef } from 'react'

import { flapDeep, isString, isUndefined, MayEnum, merge, omit, shakeNil } from '@edsolater/fnkit'

import { weakCacheInvoke } from '../../functions/dom/weakCacheInvoke'
import { mergeProps } from '../../functions/react'
import classname, { ClassName } from '../../functions/react/classname'
import mergeRefs, { loadRef } from '../../functions/react/mergeRefs'
import { ICSS, parseCSS } from '../../styles/parseCSS'
import { CSSStyle } from '../../styles/type'
import { MayDeepArray } from '../../typings/tools'
import { createDataTag, DivDataTag, htmlHasTag, hasTag, toDataset } from './tag'

export interface HTMLTagMap {
  div: HTMLDivElement
  main: HTMLDivElement
  button: HTMLButtonElement
  img: HTMLImageElement
  input: HTMLInputElement
  textarea: HTMLTextAreaElement
  video: HTMLVideoElement
  audio: HTMLAudioElement
  a: HTMLAnchorElement
  p: HTMLParagraphElement
}

/** richer than ReactNode */
export interface DivProps<TagName extends keyof HTMLTagMap = 'div'> {
  as?: MayEnum<keyof ReactHTML> | ((...params: any[]) => ReactNode) // assume a function return ReactNode is a Component
  /** it can hold some small logic scripts. only trigger once, if you need update frequently, please use `domRef`*/
  domRef?: MayDeepArray<
    MutableRefObject<HTMLElement | null | undefined> | ((el: HTMLElement) => void) | null | undefined
  >
  /**
   * a special props, it won't render anything for `<div>`'s DOM, just a label for {@link pickChildByTag}\
   * give a tag, means it's special in it's context
   */
  tag?: MayDeepArray<DivDataTag>
  className?: MayDeepArray<ClassName | undefined>
  onClick?: MayDeepArray<
    | ((payload: {
        event: React.MouseEvent<HTMLElement, MouseEvent>
        ev: React.MouseEvent<HTMLElement, MouseEvent>
        el: HTMLElement
      }) => void)
    | undefined
  >
  icss?: ICSS
  style?: MayDeepArray<CSSStyle | undefined>
  htmlProps?: MayDeepArray<JSX.IntrinsicElements[TagName] | undefined>

  children?: ReactNode
}

// _DivProps is for merge easily
/** can only use these **special props** directly on <Div> / <Div>'s derect derivative, so it will not export*/
type _DivProps<TagName extends keyof HTMLTagMap = 'div'> = {
  /** _DivProps is weaker(can be covered) than DivProps */
  [newProp in keyof DivProps<TagName> as `${newProp}_`]: DivProps<TagName>[newProp]
}

/** only assign to  <Div>'s derect derivative compontents */
export type DerivativeDivProps<TagName extends keyof HTMLTagMap = 'div'> = DivProps<TagName> & _DivProps<TagName>

// TODO: as为组件时 的智能推断还不够好
export const Div = <TagName extends keyof HTMLTagMap = 'div'>(props: DivProps<TagName> & _DivProps<TagName>) => {
  const isHTMLTag = isString(props.as) || isUndefined(props.as)
  const divRef = useRef<HTMLTagMap[TagName]>(null)

  // tag
  const hasNoRenderTag = hasTag(props.tag, noRenderTag) || hasTag(props.tag_, noRenderTag)

  // TODO-improve DOM Cache
  if (hasNoRenderTag) return null

  const hasOffscreenTag = hasTag(props.tag, offscreenTag) || hasTag(props.tag_, offscreenTag)
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
            hasOffscreenTag && { position: 'absolute', top: -9999, left: -9999,  pointerEvents: 'none', visibility:'hidden'}
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
