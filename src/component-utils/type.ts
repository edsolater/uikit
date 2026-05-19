import type { AnyRecord } from '@edsolater/fnkit'
import type { PivPlugin } from '../components'

export type ValidProps = Record<string, any>

/** 所有createPluginManager都应该遵守这个契约 */
export interface PluginManager {
  /** 推荐。控制选项 */
  controllers?: AnyRecord

  /** 推荐。描述插件内的具体信息，供外部使用 */
  details?: AnyRecord

  /** 使用时必须对Piv注入plugin */
  plugin: PivPlugin

  /** 其他任意内容，供外部使用 */
  [specialInfoNamespace: string]: any
}
