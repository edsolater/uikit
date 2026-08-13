import type { AnyRecord } from '@edsolater/fnkit'
import type { PivPlugin } from '../kits/Piv'

export type ValidProps = Record<string, any>

/** 所有createPluginManager都应该遵守这个契约 */
export type PluginManager= [controllers: AnyRecord, plugin: PivPlugin<any>]

