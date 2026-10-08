/** 相对 OKLCH 颜色的内容组织。
 *
 * 连接来源颜色与通道内容，延迟生成相对颜色文本。
 *
 * 通道可以来自任意内容，规则解释和资源定义由依赖自身负责。
 */
import { createJSSContent, type Expression } from '../../../content'
import type { ValueInput } from '../../../value'

/**
 * 构造输出相对 OKLCH 颜色的 Expression；来源或通道尚未输出时不产生文本。
 * @example
 * relativeOKLCH('red', 'calc(l + 0.1) c h / alpha')
 * // 输出 oklch(from red calc(l + 0.1) c h / alpha)。
 */
export const relativeOKLCH = (source: ValueInput, channels: ValueInput): Expression =>
  createJSSContent(resolve => {
    const color = resolve(source)
    const values = resolve(channels)
    return color === undefined || values === undefined ? undefined : `oklch(from ${color} ${values})`
  }, [source, channels])
