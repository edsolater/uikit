import { MayEnum } from '@edsolater/fnkit'
import { MutableRefObject, ReactElement, ReactHTML, ReactNode } from 'react'
import { ClassName } from '../functions/react/classname'
import { WithPlugins, WrapperNodeFn } from '../plugins/type'
import { ICSS } from '../styles/parseCSS'
import { CSSStyle } from '../styles/type'
import { MayDeepArray } from '../typings/tools'
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
  as?: MayEnum<keyof ReactHTML> // assume a function return ReactNode is a Component

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
  children?: DivChildNode
  /**
   * change outter wrapper element   
   */ 
  dangerousRenderWrapperNode?: MayDeepArray<WrapperNodeFn>
}

export type DivChildNode = ReactNode | { [Symbol.toPrimitive]: () => string } | DivChildNode[]

export type WithShallowProps<TagName extends keyof HTMLTagMap = 'div'> = {
  shadowProps?: MayDeepArray<DivProps<TagName>>
}

export interface DivProps<TagName extends keyof HTMLTagMap = 'div'>
  extends DivBaseProps<TagName>,
    WithShallowProps<TagName>,
    WithPlugins<TagName> {}
