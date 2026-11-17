/**
 * 平铺样式配置的字段与快捷映射解释。
 *
 * 按输入来源、主字段和实际出现顺序选择唯一效果，再调用原字段解释。
 *
 * 让组件只声明快捷映射，不重复实现冲突和覆盖规则。
 */
import { val } from '@/foundation'
import type { StyleConfigHandler } from './styleConfig'

/** 聚合字段的来源信息；来源 0 为直接属性，来源 1 为显式配置。 */
export interface StyleConfigFieldOrigin {
  source: 0 | 1
  order: number
}

/** 只附在新聚合结果上的内部元信息，不参与配置字段枚举。 */
export const styleConfigOrigins = Symbol('样式配置来源与顺序')

/** 配置值不变，元信息只说明当前有效字段最初来自哪一层。 */
type ConfigWithOrigins = Record<string, unknown> & {
  [styleConfigOrigins]?: Map<string, StyleConfigFieldOrigin>
}

/** 绑定层使用已校验的字段定义，不重新推导组件值域。 */
export type StyleConfigDefinition = Partial<
  Record<string, StyleConfigHandler<never> | Record<string, string | undefined>>
>

/**
 * 直接解释平铺定义：函数是实际效果，对象是布尔字段启用的一层目标映射。
 * 先为每个目标选唯一胜者，再按定义中的函数顺序应用一次；清空目标不调用效果。
 * 显式配置来源优先，同来源实际字段优先；快捷按输入出现顺序后者优先。
 *
 * @example
 * interpretStyleConfig({
 *   $direction: (value: string) => direction.set(value),
 *   $row: { $direction: 'row' },
 *   $col: { $direction: 'column' },
 * }, { $col: true })
 */
export function interpretStyleConfig(
  definition: StyleConfigDefinition,
  config: ConfigWithOrigins | undefined,
): void {
  if (config === undefined) return
  const keys = Object.keys(config)
  const origins = config[styleConfigOrigins]
  const selected = new Map<
    string,
    StyleConfigFieldOrigin & { value: unknown; primary: boolean }
  >()
  /**
   * 为一个实际目标保留来源更高或同层更明确、出现更晚的有效候选。
   */
  const offer = (
    target: string,
    value: unknown,
    origin: StyleConfigFieldOrigin,
    primary: boolean,
  ) => {
    const previous = selected.get(target)
    if (
      !previous ||
      origin.source > previous.source ||
      (origin.source === previous.source &&
        (primary || (!previous.primary && origin.order > previous.order)))
    ) {
      selected.set(target, { value, primary, ...origin })
    }
  }
  for (const [field, declaration] of Object.entries(definition)) {
    if (declaration === undefined) continue
    if (!(field in config)) continue
    const origin = origins?.get(field) ?? {
      source: 1 as const,
      order: keys.indexOf(field),
    }
    const value = val(config[field])
    if (typeof declaration === 'function') {
      if (value !== undefined || origin.source === 1)
        offer(field, value, origin, true)
    } else if (value === true) {
      for (const [target, mappedValue] of Object.entries(declaration)) {
        offer(target, mappedValue, origin, false)
      }
    }
  }
  for (const [field, declaration] of Object.entries(definition)) {
    if (typeof declaration !== 'function') continue
    const candidate = selected.get(field)
    if (candidate?.value !== undefined) declaration(candidate.value as never)
  }
}
