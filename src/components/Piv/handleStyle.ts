/**
 * 这个文件负责把 Piv 的 style 声明消费到真实 DOM inline style。
 * 它不负责 class、普通 HTML props、事件或 plugin 解析。
 * 字符串 style 会先转成字段对象，再和对象 style 按字段合并并订阅。
 */
import { isTruthy, toArray, type MayArray } from '@edsolater/fnkit'
import { createRenderEffect, onCleanup, type JSX } from 'solid-js'
import { val, type Source } from '../../hooks'

type StyleValueAtom = string | number | null | undefined
type StyleRecord = {
  [Key in keyof JSX.CSSProperties]?: Source<JSX.CSSProperties[Key] | null | undefined>
}
type StyleAtom = string | StyleRecord
type ParsedStyleRecord = Record<string, Source<StyleValueAtom>>

/** 一份完整 style 声明；外层 Source 可以整体替换 style 对象或对象列表。 */
export type StyleList = Source<MayArray<Source<StyleAtom> | undefined>>

/**
 * 消费整合后的 style 声明，按 CSS 字段选择最终值并维护 DOM inline style。
 */
export function consumeStyle(
  element: HTMLElement,
  readStyleList: () => StyleList | undefined,
) {
  createRenderEffect(() => {
    const styles = toArray(val(readStyleList()))
      .map((style) => val(style))
      .filter(isTruthy)
    const styleRecord = mergeStyleRecords(styles)

    for (const [key, value] of Object.entries(styleRecord)) {
      createRenderEffect(() => {
        setStyleProperty(element, key, val(value))
        onCleanup(() => {
          element.style.removeProperty(key)
        })
      })
    }
  })
}

/**
 * 所有 style 来源先归一成对象字段，再按字段合并，后声明字段覆盖前声明字段。
 */
function mergeStyleRecords(styles: StyleAtom[]): ParsedStyleRecord {
  const styleRecords = styles.map((style) => parseStyleRecord(style))
  const styleKeys = new Set(styleRecords.flatMap((styleRecord) => Object.keys(styleRecord)))
  const styleRecord: ParsedStyleRecord = {}

  for (const key of styleKeys) {
    for (let index = styleRecords.length - 1; index >= 0; index--) {
      const value = styleRecords[index][key]
      if (value === undefined) continue
      styleRecord[key] = value
      break
    }
  }

  return styleRecord
}

/**
 * 字符串 style 交给浏览器 CSSStyleDeclaration 解析，再转回字段对象。
 */
function parseStyleRecord(style: StyleAtom): ParsedStyleRecord {
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
