import { MayEnum } from '@edsolater/fnkit'
import { UseHoverOptions } from '@edsolater/hookit'
import { MutableRefObject, ReactHTML, ReactNode } from 'react'
import { ClassName } from '../../functions/react/classname'
import { ICSS } from '../../styles/parseCSS'
import { CSSStyle } from '../../styles/type'
import { MayDeepArray } from '../../typings/tools'
import { DivDataTag } from './utils/tag'

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

interface DivBaseProps<TagName extends keyof HTMLTagMap = 'div'> {
  as?: MayEnum<keyof ReactHTML> | ((...params: any[]) => ReactNode) // assume a function return ReactNode is a Component

  /** it can hold some small logic scripts. only trigger once, if you need update frequently, please use `domRef`*/
  domRef?: MayDeepArray<
    MutableRefObject<HTMLElement | null | undefined> | ((el: HTMLElement) => void) | null | undefined
  >
  /**
   * a special props, it won't render anything for `<div>`'s DOM, just a label for {@link pickChildByTag}\
   * give a tag, means it's special in it's context
   */
  tag?: MayDeepArray<DivDataTag | undefined>
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

export interface DivProps<TagName extends keyof HTMLTagMap = 'div'> extends DivBaseProps<TagName>, UseHoverOptions {}

// _DivProps is for merge easily
/** can only use these **special props** directly on <Div> / <Div>'s derect derivative, so it will not export*/
export type _DivProps<TagName extends keyof HTMLTagMap = 'div'> = {
  /** @deprecated */
  [newProp in keyof DivBaseProps<TagName> as `${newProp}_`]: DivBaseProps<TagName>[newProp]
}
export type ShallowDivProps<TagName extends keyof HTMLTagMap = 'div'> = {
  mergeProps?: DivBaseProps<TagName>
}
/** only assign to  <Div>'s derect derivative compontents */

export type DerivativeDivProps<TagName extends keyof HTMLTagMap = 'div'> = DivProps<TagName> & _DivProps<TagName>
