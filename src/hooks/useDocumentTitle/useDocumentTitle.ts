/**
 * 这个文件负责同步 document.title，并把浏览器当前标题作为 State 返回。
 * 它不负责路由标题规则、页面元信息管理或服务端文档头生成。
 * 调用方传入标题语义，这里只消费并镜像浏览器当前标题状态。
 */
import { createEffect, onCleanup, createState, val, type Source, type State } from '@/foundation'

/**
 * 读取浏览器当前标题；服务端使用输入来源的当前值，没有标题时返回空字符串。
 */
function readBrowserDocumentTitle(nextTitle: Source<string | undefined>) {
  // 服务端没有浏览器标题设施，只能返回调用方此刻给出的标题语义。
  return typeof document === 'undefined' ? (val(nextTitle) ?? '') : document.title
}

/**
 * 跟随标题来源同步 document.title，并返回可读取的浏览器标题状态。
 * 空标题不覆盖浏览器标题；所属作用域释放时停止观察浏览器标题变化。
 */
export function useDocumentTitle(nextTitle?: Source<string | undefined>): State<string> {
  // 这份 State 只镜像浏览器当前标题，不在 hook 内维护第二套标题真相。
  const currentTitle = createState(readBrowserDocumentTitle(nextTitle))

  if (typeof document !== 'undefined') {
    const observer = new MutationObserver(() => {
      currentTitle.set(document.title)
    })

    observer.observe(document.head, {
      childList: true,
      subtree: true,
      characterData: true,
    })

    onCleanup(() => observer.disconnect())
  }

  createEffect(() => {
    const title = val(nextTitle)

    if (typeof document === 'undefined' || typeof title !== 'string' || title.length === 0) {
      return
    }

    if (document.title !== title) {
      document.title = title
    }

    currentTitle.set(document.title)
  })

  return currentTitle
}
