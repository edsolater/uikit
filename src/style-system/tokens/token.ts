/** 首次消费时提供全局默认值及主题、媒体覆盖。 */
import { media } from '../core/css-block/media'
import { styleRule } from '../core/css-block/style'
import type { Value } from '../core/css-value'
import { variable, type Variable } from '../core/css-variable'

interface TokenOptions {
  dark?: Value
  reducedMotion?: Value
}

/**
 * 局部 CSS 变量可覆盖默认值；主题条件读取根元素的 data-theme。
 * @example
 * token('color-surface', light, { dark })
 */
export function token(name: string, initial: Value | string, options: TokenOptions = {}): Variable {
  const reference = variable(name)
  const rules = styleRule(':where(:root)')(
    reference(initial),
    options.dark === undefined ? [] : styleRule('&:where([data-theme="dark"])')(reference(options.dark)),
    options.reducedMotion === undefined
      ? []
      : media('(prefers-reduced-motion: reduce)', styleRule('&')(reference(options.reducedMotion))),
  )
  return Object.assign(reference, { onActive: () => rules })
}
