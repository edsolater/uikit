/**
 * 这个文件负责同步 document.title，并把浏览器当前标题作为 Solid accessor 暴露。
 * 它不负责路由标题规则、页面元信息管理或服务端文档头生成。
 * 调用方传入标题语义，这里只消费并镜像浏览器当前标题状态。
 */
import { createEffect, createSignal, onCleanup, type Accessor } from 'solid-js'

type DocumentTitleInput = string | Accessor<string> | undefined

function readDocumentTitleInput(nextTitle: DocumentTitleInput) {
  // 调用方传入 accessor 时，这里负责建立 Solid 依赖关系。
  return typeof nextTitle === 'function' ? nextTitle() : nextTitle
}

function readBrowserDocumentTitle(nextTitle: DocumentTitleInput) {
  // 服务端没有浏览器标题设施，只能返回调用方此刻给出的标题语义。
  return typeof document === 'undefined' ? readDocumentTitleInput(nextTitle) ?? '' : document.title
}

export function useDocumentTitle(nextTitle?: DocumentTitleInput) {
  // 这份 signal 只镜像浏览器当前标题，不在 hook 内维护第二套标题真相。
  const [currentTitle, setCurrentTitle] = createSignal(readBrowserDocumentTitle(nextTitle))

  if (typeof document !== 'undefined') {
    const observer = new MutationObserver(() => {
      setCurrentTitle(document.title)
    })

    observer.observe(document.head, {
      childList: true,
      subtree: true,
      characterData: true,
    })

    onCleanup(() => observer.disconnect())
  }

  createEffect(() => {
    const title = readDocumentTitleInput(nextTitle)

    if (typeof document === 'undefined' || typeof title !== 'string' || title.length === 0) {
      return
    }

    if (document.title !== title) {
      document.title = title
    }

    setCurrentTitle(document.title)
  })

  return currentTitle
}