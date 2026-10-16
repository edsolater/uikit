/** 自定义属性的条件修改入口。

验证双方材料、选择领域应用，构造供编译消费的修改内容。

操作入口保存颜色与表达变化规则，实例、步骤和撤销由编译实现负责。
*/
import { assert, hasMethod, hasProperty, isArray, isFunction, isMap, isNumber, isString, isUndefined, matchShape, optional, or, type DataShape } from '@edsolater/fnkit'
import { isJSSContent, type Expression } from '../content'
import type { Declaration } from './declare'
import { colorModificationShape, type ColorModificationContent } from '../modification'
import { oklch } from '../pieces/contents/functions/oklch'
import { compileVariableModification, referenceVariable, type VariableTarget } from '../variable'
import { resolveVariable } from '../variable-cluster'

/** 修改方交付的领域材料；各 type 的参数由其实际应用定义。 */
export type ModifyProtocol = Parameters<(typeof modifyTypes)[keyof typeof modifyTypes]['apply']>[1]

/** 修改目标使用公共声明材料，保留公开协议名称。 */
export type ModifyTargetProtocol = VariableTarget

/** 操作所需的自定义属性材料；继承字段和可调用对象按 FNKit 形状读取。 */
export const modifyTargetShape = {
  key: hasMethod('toCSSString', {
    resultIs: [isString, name => /^--.+/.test(name as string)],
  }),
  content: or(isString, isNumber, isUndefined, isFunction, isJSSContent),
  states: optional(isMap),
  declarations: optional(isArray),
} satisfies DataShape

/**
 * 返回条件修改 Declaration；按 type 选择应用，编译消费时生成前序 Expression 的修改结果。
 * 修改归属最近的同对象声明；颜色材料保留配方 CSS 引用，生效条件由 CSS 决定。
 * 相同 id 在同一局部声明内共用一步；未指定 id 时每次调用形成独立步骤。
 * @example
 * rules('.button', [declare(surfaceColor, baseColor)])
 * rules(['.button', '&:hover'], [modify(surfaceColor, hoverChange)])
 */
export function modify(variable: ModifyTargetProtocol, modification: ModifyProtocol, options?: { id?: string | symbol }): Declaration {
  assert(hasProperty(variable, 'content') && matchShape(variable, modifyTargetShape), 'modify 需要自定义属性的 key/content 材料。')
  const strategy = hasProperty(modification, 'type', isString) && Object.hasOwn(modifyTypes, modification.type) ? modifyTypes[modification.type] : undefined
  assert(strategy && strategy.accepts(modification), 'modify 需要颜色配方或表达变化材料。')
  variable = resolveVariable(variable)
  return [variable.key, {
    resourceIdentity: Symbol('variable-modification'),
    /**
     * 按最近声明及书写顺序发布当前修改，维护消费链和撤销关系。
     */
    onCompile(context, controller) {
      compileVariableModification(context, controller, variable, current =>
        (strategy.apply as (current: Expression, change: ModifyProtocol) => Expression)(current, modification), options?.id)
    },
  }]
}

/** 任意 CSS 表达变化的描述；回调由 Modify 使用端应用，不承诺可独立声明。 */
export interface ExpressionModification {
  type: 'expression'
  detail: (currentExpression: Expression) => Expression
}

/** 各领域的材料检查及前序表达式应用；不介入通用步骤、归属和撤销。 */
const modifyTypes = {
  color: {
    /**
     * 识别可独立声明的颜色配方，保持模块循环中的材料延迟读取。
     */
    accepts: (change: unknown) => hasProperty(change, 'content') && matchShape(change, colorModificationShape),
    /**
     * 以独立颜色配方的 CSS 引用改变前序结果。
     */
    apply: (current: Expression, change: ColorModificationContent) => oklch(current, referenceVariable(change)),
  },
  expression: {
    /**
     * 识别持有表达式变化回调的材料。
     */
    accepts: (change: unknown) => hasProperty(change, 'detail', isFunction),
    /**
     * 将前序表达式交给变化回调，保留它返回的内容与依赖。
     */
    apply: (current: Expression, change: ExpressionModification) => change.detail(current),
  },
}
