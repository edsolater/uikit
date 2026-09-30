/** CSS 纵轴平移内容。 */
import { createJSSContent } from '../../../content'
import type { ValueInput } from '../../../value'
import type { JSSContent } from '../../../content'

/** 延迟生成纵轴平移。 */
export function translateY(distance: ValueInput): JSSContent {
  return createJSSContent((resolve) => {
    const text = resolve(distance)
    return text === undefined ? undefined : `translateY(${text})`
  }, [distance])
}
