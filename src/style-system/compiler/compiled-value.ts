/** 已编译内容的位置视图；自动输出与 Join 共用原声明的消费结果。 */
import { value, type Value, type ValueData } from '../value'
import { contentToCSSString } from './content-nodes-to-css-string'
import type { ContentCompilationRecord } from './ast-controller'

/** 为原贡献建立惰性 Value；保留其位置解析结果，改写内容后由连接结果消费新内容。 */
export function createCompiledValue(content: unknown, compiledContents: WeakMap<object, ContentCompilationRecord>): Value<ValueData> {
  let view: Value<ValueData>
  view = value(content as ValueData, {
    get dependencies() { return view.content === content ? [] : value(view.content).dependencies },
    toCSSString: (current, resolve) => value(current).toCSSString(current === content
      ? (item) => contentToCSSString(item, compiledContents)
      : resolve),
  })
  return view
}

