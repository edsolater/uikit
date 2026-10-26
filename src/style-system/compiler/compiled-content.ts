/** 已编译贡献的内容视图。
 *
 * 保留原声明位置的解析结果，供组合和自动声明读取。
 *
 * 避免格式化或连接再次运行已经完成的生产函数。
 */
import {
  contentDataToCSSString,
  contentDependencies,
  type ContentView,
} from '../content'
import { contentToCSSString } from './content-nodes-to-css-string'
import type { ContentCompilationRecord } from './contracts'

/**
 * 为原始贡献建立内容视图；替换 content 后，新内容在组合结果位置消费。
 */
export function createCompiledContent(
  content: unknown,
  compiledContents:
    | WeakMap<object, ContentCompilationRecord>
    | (() => WeakMap<object, ContentCompilationRecord>),
): ContentView {
  const view: ContentView = {
    content,
    get dependencies() {
      return view.content === content ? [] : contentDependencies(view.content)
    },
    toCSSString(resolve = () => undefined) {
      return view.content === content
        ? contentToCSSString(
            content,
            typeof compiledContents === 'function'
              ? compiledContents()
              : compiledContents,
          )
        : contentDataToCSSString(view.content, resolve)
    },
  }
  return view
}
