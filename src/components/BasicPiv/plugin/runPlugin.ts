/**
 * 执行一个plugin
 */

import type { PivHTMLElement, PivTag } from '../domMap'
import type { ShadowProps } from './handlePivPlugin'

export type PivPlugin<Tag extends PivTag> = (element: PivHTMLElement<Tag>) => undefined | ShadowProps<Tag>

/** 
 * 【工具函数】
 */
export function createPivPlugin<Tag extends PivTag>(fn: PivPlugin<Tag>): PivPlugin<Tag> {
  return fn
}

/** 
 * 运行plugin
 * TODO： 基于element， 给出更多插入系列的工具
 */
export function runPlugin<Tag extends PivTag>(
  plugin: PivPlugin<Tag>,
  element: PivHTMLElement<Tag>,
): ShadowProps<Tag> | undefined {
  return plugin(element)
}

