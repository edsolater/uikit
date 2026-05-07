/**
 * 这个文件负责把 Piv 的 style 声明消费到真实 DOM inline style。
 * 它不负责 class、普通 HTML props、事件或 plugin 解析。
 * 字符串 style 会先转成字段对象，再和对象 style 按字段合并并订阅。
 */
import { shrinkFn, toArray } from '@edsolater/fnkit'
import { createRenderEffect, type Accessor, type JSX } from 'solid-js'
import type { PropValueWrapper } from './type'

type StyleValueAtom = string | number | null | undefined
type StyleFieldValue<Key extends keyof JSX.CSSProperties> =
  | JSX.CSSProperties[Key]
  | null
  | Accessor<JSX.CSSProperties[Key] | null | undefined>
type StyleRecord = {
  [Key in keyof JSX.CSSProperties]?: StyleFieldValue<Key>
}
type ParsedStyleRecord = Record<string, StyleValueAtom | Accessor<StyleValueAtom>>

export type StyleValue = string | StyleRecord | null | undefined
export type StyleList = PropValueWrapper<StyleValue>

/**
 * style 是 DOM 自带的特殊能力，按 CSS 字段合并和订阅，不混进普通 htmlProps。
 */
export function consumeStyle(element: HTMLElement, styleList: StyleList) {
  const styles = toArray(styleList)
  const styleRecord = mergeStyleRecords(styles)

  for (const [key, value] of Object.entries(styleRecord)) {
    createRenderEffect(() => {
      setStyleProperty(element, key, shrinkFn(value as StyleValueAtom | Accessor<StyleValueAtom>))
    })
  }
}

/**
 * 所有 style 来源先归一成对象字段，再按字段合并，后声明字段覆盖前声明字段。
 */
function mergeStyleRecords(styles: StyleValue[]): ParsedStyleRecord {
  const styleRecord: ParsedStyleRecord = {}
  for (const style of styles) {
    Object.assign(styleRecord, parseStyleRecord(style))
  }
  return styleRecord
}

/**
 * 字符串 style 交给浏览器 CSSStyleDeclaration 解析，再转回字段对象。
 */
function parseStyleRecord(style: StyleValue): ParsedStyleRecord {
  if (!style) {
    return {}
  }

  if (typeof style !== 'string') {
    return style as ParsedStyleRecord
  }

  const element = document.createElement('div')
  element.style.cssText = style

  const styleRecord: ParsedStyleRecord = {}
  for (const key of Array.from(element.style)) {
    styleRecord[key] = element.style.getPropertyValue(key)
  }
  return styleRecord
}

/**
 * 单个 CSS 字段的空值语义是移除该字段。
 */
function setStyleProperty(element: HTMLElement, key: string, value: StyleValueAtom) {
  if (value == null || value === '') {
    element.style.removeProperty(key)
    return
  }

  element.style.setProperty(key, String(value))
}
