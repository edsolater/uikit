import { MayEnum, MayFn } from '@edsolater/fnkit'
import { MutableRefObject, ReactHTML, ReactNode } from 'react'
import { WithPlugins, WrapperNodeFn } from '../plugins/type'
import { ICSS } from '../styles/parseCSS'
import { CSSStyle } from '../styles/type'
import { MayDeepArray } from '../typings/tools'
import { ClassName } from '../utils/react'
import { DivDataTag } from './handles/tag'

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
  iframe: HTMLIFrameElement
}
/** richer than ReactNode */

interface DivBaseProps<TagName extends keyof HTMLTagMap = any, Status extends Record<string, any> | unknown = unknown> {
  as?: MayEnum<keyof ReactHTML> // assume a function return ReactNode is a Component

  _statusObj?: Status // wall provide additional info for `onClick` `icss` `onClick` `htmlProps`

  /** it can hold some small logic scripts. only trigger once, if you need update frequently, please use `domRef`*/
  domRef?: MayDeepArray<
    MutableRefObject<HTMLElement | null | undefined> | ((el: HTMLElement) => void) | null | undefined
  >
  /**
   * a special props, it won't render anything for `<div>`'s DOM, just a label for {@link pickChildByTag}\
   * give a tag, means it's special in it's context
   */
  tag?: MayDeepArray<DivDataTag | undefined> // !!!TODO: it's better to be a plugin
  className?: MayDeepArray<ClassName | undefined>
  onClick?: (
    utils: {
      event: React.MouseEvent<HTMLElement, MouseEvent>
      ev: React.MouseEvent<HTMLElement, MouseEvent>
      el: HTMLElement
    } & Status
  ) => void
  icss?: ICSS<Status>
  style?: MayDeepArray<MayFn<CSSStyle, [status: Status]> | undefined>
  htmlProps?: MayDeepArray<
    MayFn<JSX.IntrinsicElements[TagName extends {} ? TagName : any], [status: Status]> | undefined
  >
  children?: DivChildNode
  /**
   * change outter wrapper element
   */
  dangerousRenderWrapperNode?: MayDeepArray<WrapperNodeFn>
}

export type Status = Record<string, any>
export type DivChildNode = ReactNode

export type WithShallowProps<TagName extends keyof HTMLTagMap = any> = {
  shadowProps?: MayDeepArray<Partial<DivProps<TagName>>>
}

export interface DivProps<TagName extends keyof HTMLTagMap = any>
  extends DivBaseProps<TagName>,
    WithShallowProps<TagName>,
    WithPlugins<TagName> {}

type C = { hello: 's' } & unknown
type D = keyof C
