import { createElement, CSSProperties, ReactNode, RefObject } from 'react'
import { useRef } from 'react'
import classname, { ClassName } from '../functions/classname'
import mergeRefs from '../functions/mergeRefs'
import { mergeObjects } from '@edsolater/fnkit/src/object'
import { MayDeepArray } from '../typings/tools'

export interface TagMap {
  div: HTMLDivElement
  main: HTMLDivElement

  button: HTMLButtonElement
  img: HTMLImageElement
  input: HTMLInputElement
  textarea: HTMLTextAreaElement
  video: HTMLVideoElement
}

export interface DivProps<TagName extends keyof TagMap = 'div'> {
  as?: TagName
  domRef?: MayDeepArray<RefObject<HTMLElement>>
  className?: MayDeepArray<ClassName>
  style?: MayDeepArray<CSSProperties>
  htmlProps?: JSX.IntrinsicElements[TagName]
  children?: ReactNode
}

// TODO: as为组件时 的智能推断还不够好
const Div = <TagName extends keyof TagMap = 'div'>(props: DivProps<TagName>) => {
  const divRef = useRef<TagMap[TagName]>(null)

  return createElement(
    props.as ?? 'div',
    {
      ...props.htmlProps,
      className: classname(props.className),
      ref: mergeRefs(...[props.domRef, divRef].flat(Infinity)),
      style: mergeObjects(...[props.style].flat())
    },
    props.children
  )
}
export default Div
