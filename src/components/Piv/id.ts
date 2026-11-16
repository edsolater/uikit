/**
 * 这个文件负责把 Piv 的 id 声明消费到真实 DOM。
 * id 不修正上游合并结果，列表会按 JavaScript 规则直接转成 DOM 字符串。
 */
import type { MayArray, ID } from '@edsolater/fnkit'
import { createRenderEffect, onCleanup, val, type Source } from '@/foundation'

/** 响应式维护 Piv 根 DOM 的唯一 id；空值表示当前没有 id。 */
export function consumeId(
  element: HTMLElement,
  readId: () => Source<MayArray<ID> | undefined>,
) {
  const original = element.getAttribute('id')
  onCleanup(() => {
    if (original === null) element.removeAttribute('id')
    else element.setAttribute('id', original)
  })
  createRenderEffect(
    () => val(readId()),
    (id) => {
      if (id === undefined) {
        element.removeAttribute('id')
      } else {
        element.id = String(id)
      }
    },
  )
}
