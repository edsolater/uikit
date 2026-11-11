/**
 * 自定义属性的条件修改入口。
 *
 * 验证双方材料、选择领域应用，构造供编译消费的修改内容。
 *
 * 操作入口保存颜色与表达变化规则，实例、步骤和撤销由编译实现负责。
 */
import { compileCSSModification } from '../token/modify'
import { cssCustomProperty, cssOperation } from '../token/css'
import {
  assert,
  hasProperty,
  isFunction,
  isString,
  matchShape,
} from '@edsolater/fnkit'
import { type Expression } from '../content'
import type { Declaration } from './declare'
import {
  colorModificationShape,
  type ColorModificationContent,
} from '../modification'
import { oklch } from '../pieces/functions/oklch'
import { isToken, type Token, type TokenInput } from '../token/core'

/** 修改方交付的领域材料；各 type 的参数由其实际应用定义。 */
export type ModifyProtocol = Parameters<
  (typeof modifyTypes)[keyof typeof modifyTypes]['apply']
>[1]

/**
 * 返回条件修改 Declaration；按 type 选择应用，
 * 编译消费时生成前序 Expression 的修改结果。
 * 修改以根据地的有效声明为基础；颜色材料保留配方 CSS 引用，
 * 生效条件由 CSS 决定。
 * 相同 id 在同一定义内共用一步；未指定 id 时每次调用形成独立步骤。
 * @example
 * const surfaceColor = token(baseColor, {
 *   name: 'button-surface',
 *   address: '.Button',
 * })
 * rules('.Button', [[key('background-color'), surfaceColor]])
 * rules(['.Button', '&:hover'], [modify(surfaceColor, hoverChange)])
 */
export function modify(
  target: Token,
  modification: ModifyProtocol,
  options?: { id?: string | symbol },
): Declaration {
  assert(isToken(target), 'modify 需要 Token 目标。')
  const strategy =
    hasProperty(modification, 'type', isString) &&
    Object.hasOwn(modifyTypes, modification.type)
      ? modifyTypes[modification.type]
      : undefined
  assert(
    strategy && strategy.accepts(modification),
    'modify 需要颜色配方或表达变化材料。',
  )
  const content = Object.assign(
    cssOperation((context, controller) => {
      compileCSSModification(
        context,
        controller,
        cssCustomProperty(target),
        (current) =>
          (
            strategy.apply as (
              current: Expression,
              change: ModifyProtocol,
            ) => TokenInput
          )(current, modification),
        options?.id,
      )
    }),
    { kind: 'css-modification' },
  )
  return [target, content]
}

/** 任意 CSS 表达变化的描述；回调由 Modify 使用端应用，不承诺可独立声明。 */
export interface ExpressionModification {
  type: 'expression'
  detail: (currentExpression: Expression) => TokenInput
}

/** 各领域的材料检查及前序表达式应用；不介入通用步骤、归属和撤销。 */
const modifyTypes = {
  color: {
    /**
     * 识别可独立声明的颜色配方，保持模块循环中的材料延迟读取。
     */
    accepts: (change: unknown) =>
      isToken(change) && matchShape(change, colorModificationShape),
    /**
     * 以独立颜色配方的 CSS 引用改变前序结果。
     */
    apply: (current: Expression, change: ColorModificationContent) =>
      oklch(current, change),
  },
  expression: {
    /**
     * 识别持有表达式变化回调的材料。
     */
    accepts: (change: unknown): boolean =>
      hasProperty(change, 'detail', isFunction),
    /**
     * 将前序表达式交给变化回调，保留它返回的内容与依赖。
     */
    apply: (current: Expression, change: ExpressionModification) =>
      change.detail(current),
  },
}
