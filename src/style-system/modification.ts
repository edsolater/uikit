/** 可独立声明的变化描述。

保存名称与领域参数，按 type 选择源无关内容转译，并提供声明与应用材料。

变化与来源分别复用，绑定和条件应用由 Adjust、Modify 的使用端组织。
*/
import {
  assert,
  is,
  hasMethod,
  isFunction,
  isNumber,
  isObject,
  isString,
  isUndefined,
  matchShape,
  or,
  type DataShape
} from '@edsolater/fnkit'
import { createJSSContent, isJSSContent, type Expression, type JSSContent } from './content'
import type { DeclareProtocol } from './declaration'
import { allocateVariableName, key } from './key'
import { value, type ValueInput } from './value'
import { compileVariableContent } from './variable'

/** 变化自身就是定义；Detail/Type 表达领域差异，key 与 CSS 目标始终跟随当前完整 name。 */
export interface Modification<Detail = unknown, Type extends string = string> extends DeclareProtocol, JSSContent {
  type: Type
  name: string
  detail: Detail
  /**
   * 返回自身 CSS 自定义属性名，供声明目标使用。
   */
  toCSSString(): string
}

/**
 * 保存 type/name/detail；按 type 的策略校验描述，消费时转译源无关内容。
 * name 保持完整 CSS 名称，省略时自动分配；构造不执行内容回调。
 */
export function modification<Type extends keyof typeof modificationTypes>(
  definition: Pick<Modification<ModificationDetails[Type], Type>, 'type' | 'detail'> & { name?: string },
): Modification<ModificationDetails[Type], Type> {
  assert(
    isString(definition.type) && Object.hasOwn(modificationTypes, definition.type),
    `Modification 尚未支持内容领域：${definition.type}。`,
  )
  const strategy = (modificationTypes as ModificationStrategies)[definition.type]
  assert(matchShape(definition.detail, strategy.detailShape), 'Modification 需要有效 detail 材料。')
  assert(
    definition.name === undefined || (isString(definition.name) && /^--.+/.test(definition.name)),
    'Modification name 需要完整 CSS 自定义属性名。',
  )
  let name = definition.name === undefined ? `--${allocateVariableName()}` : allocateVariableName(definition.name)
  const self: Modification<ModificationDetails[Type], Type> = {
    ...definition,
    get name() {
      return name
    },
    /**
     * 登记新的显式配方名称，使后续匿名对象避让它。
     */
    set name(nextName) {
      assert(isString(nextName) && /^--.+/.test(nextName), 'Modification name 需要完整 CSS 自定义属性名。')
      name = allocateVariableName(nextName)
    },
    get key() {
      return key(self.name)
    },
    content: {
      /**
       * 当前描述在消费时转译，不冻结创建时的 detail 或回调结果。
       */
      onCompile: (context, controller) => controller.setContent(context, strategy.toContent(self.detail)),
    },
    /**
     * 作为 CSS Key 输出当前完整名称。
     */
    toCSSString() {
      return self.name
    },
    /**
     * 普通消费提供配方引用；作为声明目标时保留属性名。
     */
    onCompile: (context, controller) => compileVariableContent(self, context, controller),
  }
  return self
}

/** 各 type 的 detail 由该策略的转译签名决定，不重复手写一份领域映射。 */
type ModificationDetails = {
  [Type in keyof typeof modificationTypes]: Parameters<(typeof modificationTypes)[Type]['toContent']>[0]
}
/** 同一 type 的形状与转译参数保持关联，新增策略不改通用对象生命周期。 */
type ModificationStrategies = {
  [Type in keyof ModificationDetails]: {
    detailShape: DataShape
    toContent: (detail: ModificationDetails[Type]) => ValueInput
  }
}

/** 固定通道内容或当前通道表达式的变化；未指定通道保留来源。 */
export type ColorChannelModification = ValueInput | ((currentExpression: Expression) => Expression)

/** 一份 OKLCH 变化参数；回调在配方编译时收到 l/c/h/alpha 表达式。 */
export interface ColorModificationDetail {
  lightness?: ColorChannelModification
  chroma?: ColorChannelModification
  hue?: ColorChannelModification
  alpha?: ColorChannelModification
}

/** 颜色应用的材料；content 是独立配方，使用端负责引用它并组合来源。 */
export interface ColorModificationContent extends DeclareProtocol {
  type: 'color'
}

/** 颜色操作需要领域标识及可声明的源无关配方材料。 */
export const colorModificationShape = {
  type: is('color'),
  key: hasMethod('toCSSString', {
    resultIs: [isString, (name) => /^--.+/.test(name)],
  }),
  content: or(isString, isNumber, isUndefined, isFunction, isJSSContent),
} satisfies DataShape

/**
 * 用通道符号转译颜色 detail，内容依赖保留到输出阶段，调用方负责消费时机。
 * 可调用 JSS 内容保留为内容，普通回调接收当前通道的表达式。
 */
function colorContent(detail: ColorModificationDetail): Expression {
  const channels = Object.entries({ l: detail.lightness, c: detail.chroma, h: detail.hue, alpha: detail.alpha }).map(
    ([symbol, change]) =>
      change === undefined ? symbol : !isJSSContent(change) && isFunction(change) ? change(value(symbol)) : change,
  )
  return createJSSContent((resolve) => {
    const values = channels.map(resolve)
    return values.some((channel) => channel === undefined)
      ? undefined
      : `${values[0]} ${values[1]} ${values[2]} / ${values[3]}`
  }, channels)
}

/** 当前内置的 type 转译；扩展领域在这里增加独立描述与策略，通用生命周期不变。 */
const modificationTypes = { color: { detailShape: isObject, toContent: colorContent } }
