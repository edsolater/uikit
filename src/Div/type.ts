import { MayArray, MayEnum } from '@edsolater/fnkit'
import { JSXElement } from 'solid-js'
import { WithPlugins, WrapperNodeFn } from '../plugins/type'
import { ICSS } from '../styles/parseCSS'
import { CSSStyle } from '../styles/type'
import { ValidStatus } from '../typings/tools'
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

interface DivBaseProps<TagName extends keyof HTMLTagMap = 'div'> {
  as?: MayEnum<keyof JSX.IntrinsicElements> // assume a function return ReactNode is a Component

  /** it can hold some small logic scripts. only trigger once, if you need update frequently, please use `domRef`*/
  domRef?: MayArray<((el: HTMLElement) => void) | null | undefined>
  /**
   * a special props, it won't render anything for `<div>`'s DOM, just a label for {@link pickChildByTag}\
   * give a tag, means it's special in it's context
   */
  tag?: MayArray<DivDataTag | undefined> // !!!TODO: it's better to be a plugin
  class?: MayArray<ClassName | undefined>
  onClick?: (utils: {
    ev: MouseEvent & {
      currentTarget: HTMLElement
      target: Element
    }
    el: HTMLElement
  }) => void
  icss?: ICSS
  style?: MayArray<CSSStyle | undefined>
  htmlProps?: MayArray<JSX.IntrinsicElements[TagName extends {} ? TagName : any] | undefined>
  children?: JSXElement
  /**
   * change outter wrapper element
   */
  dangerousRenderWrapperNode?: MayArray<WrapperNodeFn>
}

export type Status = Record<string, any>
export type DivChildNode<Status extends ValidStatus = {}> = JSXElement | ((status: Status) => JSXElement)

export type WithShallowProps<TagName extends keyof HTMLTagMap = 'div'> = {
  shadowProps?: MayArray<DivProps<TagName>>
}

export interface DivProps<TagName extends keyof HTMLTagMap = 'div'>
  extends DivBaseProps<TagName>,
    WithShallowProps<TagName>,
    WithPlugins<TagName> {}

export type Ref<T> = (el: T) => void
