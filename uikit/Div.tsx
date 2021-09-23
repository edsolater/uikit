import type { MayDeepArray } from '../typings/tools'
import { CSSProperties, ReactNode, RefObject, useEffect } from 'react'
import { twMerge } from 'tailwind-merge'
import { createElement } from 'react'
import { useRef } from 'react'
import mergeRefs from '../functions/react/mergeRefs'
import { mergeObjects, omit } from '@edsolater/fnkit/src/object'
import { isString, isUndefined } from '@edsolater/fnkit/src/judgers'
import { classname } from '../functions'
import { ClassName } from '../functions/react/classname'

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
  as?: TagName | ((...params: any[]) => ReactNode) // assume a function return ReactNode is a Component

  domRef?: MayDeepArray<RefObject<HTMLElement>>
  className?: MayDeepArray<ClassName>
  style?: MayDeepArray<CSSProperties>
  htmlProps?: JSX.IntrinsicElements[TagName]
  children?: ReactNode

  /** attach css variable:  --left --right --top --bottom --width --height. for some special style classname*/
  boundingBoxCSS?: boolean
}

// TODO: as为组件时 的智能推断还不够好
const Div = <TagName extends keyof TagMap = 'div'>(props: DivProps<TagName>) => {
  const isHTMLTag = isString(props.as) || isUndefined(props.as)
  const divRef = useRef<TagMap[TagName]>(null)

  useEffect(() => {
    if (props.boundingBoxCSS) {
      const rect = divRef.current.getBoundingClientRect()
      divRef.current.style.setProperty('--left', String(rect.left))
      divRef.current.style.setProperty('--right', String(rect.right))
      divRef.current.style.setProperty('--top', String(rect.top))
      divRef.current.style.setProperty('--bottom', String(rect.bottom))
      divRef.current.style.setProperty('--width', String(rect.width))
      divRef.current.style.setProperty('--height', String(rect.height))
    }
  }, [])
  return isHTMLTag
    ? createElement(
        // @ts-expect-error assume a function return ReactNode is a Component
        props.as ?? 'div',
        {
          ...props.htmlProps,
          className: twMerge(classname(props.className)),
          ref: mergeRefs(...[props.domRef, divRef].flat(Infinity)),
          style: mergeObjects(...[props.style].flat())
        },
        props.children
      )
    : createElement(
        // @ts-expect-error assume a function return ReactNode is a Component
        props.as,
        omit(props, 'as'),
        props.children
      )
}
export default Div
