/**
 * Piv 的节点字段合并规则。
 *
 * 来源展开与读取消费交给公共声明工具；本文件只决定节点字段覆盖或累加的方式。
 */
import { mergeMayArray } from '@edsolater/fnkit'
import { val } from '@/foundation'
import type { PivProps } from '../Piv'
import type { PivTag } from '../domMap'
import {
  createPropsDeclaration,
  type PropSource,
  type PropAccumulation,
  type PropSelection,
} from '../../tools/propsDeclaration/shadowProps'

/** Piv 可接受的补充声明，children 仍由直接输入提供。 */
export type ShadowProps<Tag extends PivTag> = Omit<PivProps<Tag>, 'children'>

/**
 * 节点的集合字段累加来源，结构字段和普通字段按优先级选择。
 */
const isPivAccumulatedProp = (key: PropertyKey) =>
  key === 'id' ||
  key === 'class' ||
  key === 'style' ||
  key === 'htmlProps' ||
  key === 'on' ||
  key === 'domRef' ||
  key === 'label'

/**
 * 同一字段只读取真实声明来源，不因消费顺带启用缺省字段。
 */
function readPivPropSources(
  key: PropertyKey,
  sources: readonly PropSource[],
  direct?: PropSource,
): PropSelection {
  const participating: unknown[] = []
  for (let index = 0; index < sources.length; index++) {
    // 本地指令只替换直接声明；未写入时保留原始 Source 与 undefined 截断。
    const source = index === 0 && direct?.has(key) ? direct : sources[index]
    if (!source.has(key)) continue
    const contribution = source.readContribution?.(key)
    const raw = contribution ? contribution.value : source.read(key)
    const stopsLower = contribution
      ? contribution.stopsLower
      : raw === undefined
    // 已处理来源的 undefined 可能只是完成值；截断事实由该层的原声明决定。
    if (raw !== undefined) participating.push(raw)
    if (stopsLower) return { values: participating, stopsLower: true }
  }
  return { values: participating, stopsLower: false }
}

/** 已选中来源的完成值按节点规则累加，不重新读取字段getter。 */
function mergePivPropValues(participating: readonly unknown[]): unknown {
  let firstValue: unknown
  let values: unknown[] | undefined
  for (let index = participating.length - 1; index >= 0; index--) {
    const value = val(participating[index])
    if (firstValue === undefined) firstValue = value
    else (values ??= [firstValue]).push(value)
  }
  return values ? mergeMayArray(...values) : firstValue
}

/** Piv 的完整字段累加策略；使用方无需自行组合原始来源和完成值两条读取路径。 */
export const pivPropAccumulation: PropAccumulation = {
  matches: isPivAccumulatedProp,
  collect: readPivPropSources,
  merge: mergePivPropValues,
}

/**
 * 直接 Piv 与 Kit 使用同一个公共声明入口，不重复展开上层已经接入的 Plugin。
 */
export function mergePivProps<Tag extends PivTag>(
  props: PivProps<Tag>,
): PivProps<Tag> {
  return createPropsDeclaration(props, {
    accumulate: pivPropAccumulation,
  }).consume()
}
