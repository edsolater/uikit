import { MayArray, MayEnum } from '@edsolater/fnkit'
import { UseHoverOptions } from '@edsolater/hookit'
import { MutableRefObject, ReactHTML, ReactNode } from 'react'
import { ClassName } from '../functions/react/classname'
import { ICSS } from '../styles/parseCSS'
import { CSSStyle } from '../styles/type'
import { MayDeepArray } from '../typings/tools'
import { AbilityPlugin, WithPlugins } from '../plugins/type'
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
  as?: MayEnum<keyof ReactHTML> | ((...params: any[]) => JSX.Element) // assume a function return ReactNode is a Component

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
  propHook?: MayDeepArray<
    (props: Omit<DivBaseProps<TagName>, 'propHook'>) => Omit<DivBaseProps<TagName>, 'propHook'> | undefined
  > // !!!TODO: it's better to be a plugin
  icss?: ICSS
  style?: MayDeepArray<CSSStyle | undefined>
  htmlProps?: MayDeepArray<JSX.IntrinsicElements[TagName] | undefined>
  children?: DivChildNode
}

export type DivChildNode = ReactNode | { [Symbol.toPrimitive]: () => string } | DivChildNode[]

export type WithShallowProps<TagName extends keyof HTMLTagMap = 'div'> = {
  shadowProps?: MayDeepArray<DivProps<TagName>> // !!!TODO: it's better to be a plugin
}

export interface DivProps<TagName extends keyof HTMLTagMap = 'div'>
  extends DivBaseProps<TagName>,
    WithShallowProps<TagName>,
    WithPlugins<TagName> {}
