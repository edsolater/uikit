/**
 * 这个文件负责把 Piv 的 class 声明消费到真实 DOM classList。
 * 它不负责创建 DOM、解析 plugin、处理 style、普通 HTML props 或事件。
 * Piv 在 plugin 合并完成后调用这里，保证 class 与其他 DOM 能力走同一条消费路径。
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
import { val, type Source } from '../../hooks'

export type ClassNameAtom = Stringable | MayArray<Stringable> | { [classname: string]: Source<Booleanable> }
export type ClassNameList = Source<MayArray<Source<ClassNameAtom> | undefined>>

/**
 * class 是 Piv 的 DOM 消费能力，必须经过 plugin 合并后再绑定到真实节点。
 */
export function consumeClassName(element: Element, classNameList: ClassNameList) {
  const tokenCounts = new Map<string, number>()

  createRenderEffect(() => {
    const lists = toArray(val(classNameList)).filter(isTruthy)

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
