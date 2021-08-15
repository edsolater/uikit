import { createElement, CSSProperties, FC, ReactNode, RefObject } from 'react'
import { useRef } from 'react'
import classname, { ClassName } from '../functions/classname'
import mergeRefs from '../functions/mergeRefs'
import { isString, isUndefined } from '@edsolater/fnkit/src/judgers'
import { mergeObjects, omit } from '@edsolater/fnkit/src/object'
import React from 'react'
import { MayArray } from '../typings/tools'

/**
 * 这个纯粹是 tag名 与相应的 HTMLElement 转换
 */
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
  // 只能低层组件使用
  as?: TagName | FC | typeof React.Fragment
  domRef?: MayArray<RefObject<HTMLElement>>
  className?: MayArray<ClassName>
  style?: MayArray<CSSProperties>
  htmlProps?: JSX.IntrinsicElements[TagName]
  children?: ReactNode
}

// TODO: as为组件时 的智能推断还不够好
const Div = <TagName extends keyof TagMap = 'div'>(props: DivProps<TagName>) => {
  const divRef = useRef<TagMap[TagName]>(null)

  return isUndefined(props.as) || isString(props.as)
    ? createElement(props.as ?? 'div', {
        ...props.htmlProps,
        children: props.children,
        className: classname(props.className),
        ref: mergeRefs(...[props.domRef, divRef].flat()),
        style: mergeObjects([props.style].flat())
      })
    : // @ts-expect-error don't know why
      createElement(props.as, omit(props, 'as'))
}
export default Div
