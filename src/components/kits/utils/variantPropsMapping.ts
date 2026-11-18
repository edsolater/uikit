/**
 * Variant 选值到原生描述值的映射。
 *
 * 持续转换选值来源，映射表未指定的值保留原义。
 *
 * 让原生属性表达与组件的业务选值保持分离。
 */
import { derive } from '@/hooks'
import type { Source } from '@/foundation'

/**
 * 按静态映射表持续转换选值来源；未配置的值保持原样，表自身不主动触发更新。
 */
export function mapVariantProps<Candidate extends string>(
  source: Source<Candidate | undefined>,
  mapping: Record<string, string | undefined>,
) {
  return derive(source, value =>
    Object.hasOwn(mapping, String(value)) ? mapping[String(value)] : value,
  )
}
