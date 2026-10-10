import { mapSource } from '@/hooks'
import { type Source } from '@/foundation'

/** 转换 DOM 描述；未配置的值保持原样，表自身不主动触发更新。 */
export function mapVariantProps<Candidate extends string>(
  source: Source<Candidate | undefined>,
  mapping: Record<string, string | undefined>,
) {
  return mapSource(source, (value) => Object.hasOwn(mapping, String(value)) ? mapping[String(value)] : value)
}
