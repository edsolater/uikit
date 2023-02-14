import { MayEnum, MayFn } from '@edsolater/fnkit'
import { JSXElement } from 'solid-js'
import { WithPlugins, WrapperNodeFn } from '../plugins/type'
import { ICSS } from '../styles/parseCSS'
import { CSSStyle } from '../styles/type'
import { MayDeepArray, ValidStatus } from '../typings/tools'
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

interface DivBaseProps<Status extends ValidStatus = {}, TagName extends keyof HTMLTagMap = 'div'> {
  as?: MayEnum<keyof JSX.IntrinsicElements> // assume a function return ReactNode is a Component

  _status?: Status // wall provide additional info for `onClick` `icss` `onClick` `htmlProps`

  /** it can hold some small logic scripts. only trigger once, if you need update frequently, please use `domRef`*/
  domRef?: MayDeepArray<((el: HTMLElement) => void) | null | undefined>
  /**
   * a special props, it won't render anything for `<div>`'s DOM, just a label for {@link pickChildByTag}\
   * give a tag, means it's special in it's context
   */
  tag?: MayDeepArray<DivDataTag | undefined> // !!!TODO: it's better to be a plugin
  className?: MayDeepArray<ClassName | undefined>
  onClick?: (utils: {
    ev: MouseEvent & {
      currentTarget: HTMLElement
      target: Element
    }
    el: HTMLElement
  }) => void
  icss?: ICSS<Status>
  style?: MayDeepArray<MayFn<CSSStyle, [status: Status]> | undefined>
  htmlProps?: MayDeepArray<
    MayFn<JSX.IntrinsicElements[TagName extends {} ? TagName : any], [status: Status]> | undefined
  >
  children?: DivChildNode<Status>
  /**
   * change outter wrapper element
   */
  dangerousRenderWrapperNode?: MayDeepArray<WrapperNodeFn>
}

export type Status = Record<string, any>
export type DivChildNode<Status extends ValidStatus = {}> = JSXElement | ((status: Status) => JSXElement)

export type WithShallowProps<Status extends ValidStatus = {}, TagName extends keyof HTMLTagMap = 'div'> = {
  shadowProps?: MayDeepArray<DivProps<Status, TagName>>
}

export interface DivProps<Status extends ValidStatus = {}, TagName extends keyof HTMLTagMap = 'div'>
  extends DivBaseProps<Status, TagName>,
    WithShallowProps<Status, TagName>,
    WithPlugins<Status, TagName> {}
