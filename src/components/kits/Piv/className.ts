/**
 * 这个文件负责把 Piv 的 class 声明消费到真实 DOM classList。
 * 它不负责创建 DOM、解析 plugin、处理 style、普通 HTML props 或事件。
 * Piv 完成 props 整合后调用这里，保证 class 与其他 DOM 能力走同一条消费路径。
 */
import {
  isObject,
  isArray,
  isTruthy,
  type Booleanable,
  type MayArray,
  type Stringable,
  toArray,
} from '@edsolater/fnkit'
import { createRenderEffect, onCleanup } from 'solid-js'
import { val, type MayArraySource, type Source } from '../../../hooks'

/** 一条 class 声明，可以是 token、token 列表或按 Source 条件启用的 token 对象。 */
export type ClassNameAtom = Stringable | MayArray<Stringable> | { [classname: string]: Source<Booleanable> }

/** 一份完整 class 声明；外层 Source 可以整体替换其中的 token 或 token 列表。 */
export type ClassNameList = MayArraySource<ClassNameAtom>

/**
 * 消费整合后的 class 声明，并响应式维护真实 DOM classList。
 */
export function consumeClassName(
  element: Element,
  readClassNameList: () => ClassNameList | undefined,
) {
  const tokenCounts = new Map<string, number>()

  createRenderEffect(() => {
    const lists = toArray(val(readClassNameList())).filter(isTruthy)

    for (const atom of lists) {
      createRenderEffect(() => {
        const tokens = resolveClassTokens(val(atom))
        addClassTokens(element, tokenCounts, tokens)
        onCleanup(() => {
          removeClassTokens(element, tokenCounts, tokens)
        })
      })
    }
  })
}

/**
 * class 字符串按空白拆成 token；对象形式按条件决定 token 是否存在。
 */
function resolveClassTokens(classAtom: ClassNameAtom | undefined): string[] {

  if (!classAtom) {
    return []
  }

  if (isObject(classAtom) && !isArray(classAtom)) {
    return Object.entries(classAtom).flatMap(([classString, condition]) =>
      val(condition) ? splitClassTokens(classString) : [],
    )
  }

  return toArray(classAtom).flatMap((item) => splitClassTokens(String(item)))
}

/**
 * 单个 class 声明里允许空白分隔的多个 token。
 */
function splitClassTokens(className: string) {
  return className.trim().split(/\s+/).filter(Boolean)
}

/**
 * 多个来源可能声明同一个 token，所以用计数维护真实 classList。
 */
function addClassTokens(element: Element, tokenCounts: Map<string, number>, tokens: string[]) {
  for (const token of tokens) {
    const count = tokenCounts.get(token) ?? 0
    if (count === 0) {
      element.classList.add(token)
    }
    tokenCounts.set(token, count + 1)
  }
}

/**
 * 只有最后一个来源释放 token 时，才从真实 DOM 上移除 class。
 */
function removeClassTokens(element: Element, tokenCounts: Map<string, number>, tokens: string[]) {
  for (const token of tokens) {
    const count = tokenCounts.get(token)
    if (count == null) {
      continue
    }

    if (count > 1) {
      tokenCounts.set(token, count - 1)
      continue
    }

    tokenCounts.delete(token)
    element.classList.remove(token)
  }
}
