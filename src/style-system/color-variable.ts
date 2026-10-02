/** 以基础色、绝对通道和独立增量声明可组合的 OKLCH 颜色。 */
import { assert } from '@edsolater/fnkit'
import type { JSSContentContext } from './content'
import { declare, type Declaration } from './declaration'
import type { Rules } from './rule'
import { variable, type Variable, type VariableOptions } from './variable'
import { value, type Value, type ValueInput } from './value'
import { oklch } from './pieces/contents/functions/oklch'
import { resourceRule } from './compiler/resource-rule'

/** 颜色沿用 Variable 消费协议；基础色、绝对通道与增量各自声明，互不清空。 */
export interface ColorVariable extends Omit<Variable, 'declare'> {
  lightness: Variable
  chroma: Variable
  hue: Variable
  alpha: Variable
  /** 仅声明基础色；省略使用创建默认色，不重置已有通道或增量。 */
  declare(source?: ValueInput): Declaration
  setLightness(content: ValueInput): Declaration
  setChroma(content: ValueInput): Declaration
  setHue(content: ValueInput): Declaration
  setAlpha(content: ValueInput): Declaration
  /** 声明独立增量；同一字段的重复声明由 CSS 层叠选择最后一个值。 */
  deltaLightness(change: ValueInput): Declaration
  deltaChroma(change: ValueInput): Declaration
  deltaHue(change: ValueInput): Declaration
  deltaAlpha(change: ValueInput): Declaration
}

/** 默认基础色为黑色；通道不预先声明，缺省在相对颜色上下文使用 l/c/h/alpha。 */
export function colorVariable(defaultColor: ValueInput = 'black',
  options: Pick<VariableOptions, 'onActive' | 'compileWaveIndex' | 'registration'> & { name: string }): ColorVariable {
  const baseColor = variable(defaultColor, { name: `${options.name}-base` })
  const channels = ['lightness', 'chroma', 'hue', 'alpha'].map((name, index) =>
    variable(['l', 'c', 'h', 'alpha'][index], { name: `${options.name}-${name}` }))
  const deltas = ['lightness', 'chroma', 'hue', 'alpha'].map((name) =>
    variable(0, { name: `${options.name}-delta-${name}` }))
  const [lightness, chroma, hue, alpha] = channels
  const aggregate = oklch(baseColor, [lightness, chroma, hue, alpha],
    [deltas[0], deltas[1], deltas[2], deltas[3]])
  const color = variable(aggregate, options)
  const compile = color.onCompile

  /** 单字段重复设置采用最后有输出的内容，不生成无效逗号列表。 */
  const join = (items: Value[]): ValueInput => value(items, { toCSSString: (contents, resolve) =>
    contents.map(resolve).filter((content) => content !== undefined).at(-1) })
  /** 在当前消费地址重算主色，避免继承父元素已计算完的主色。 */
  const activateAggregate = (context: JSSContentContext): Rules => [resourceRule(context.conditionPath, color, aggregate)]
  /** 每次编译消费产生自身激活包装，使同一声明可复用于多个地址。 */
  const set = (channel: Variable, content: ValueInput): Declaration => declare(
    { toCSSString: () => channel.toCSSString(), join },
    { onCompile: () => value(content, { onActive: activateAggregate }) },
  )

  return Object.assign(color, { lightness, chroma, hue, alpha,
    onCompile(context, controller) {
      const compiled = compile(context, controller)
      return context.role === 'declaration-key' ? compiled : value(compiled, { onActive: activateAggregate })
    },
    declare(source: ValueInput = defaultColor): Declaration {
      if (source === color) return set(baseColor, undefined)
      assert(!source || (typeof source !== 'object' && typeof source !== 'function')
        || !('kind' in source && source.kind === 'variable' && 'name' in source
          && [color, baseColor, ...channels, ...deltas].some((target) => target.name === source.name)),
      '颜色声明来源不能引用自身的基础色或通道名称。')
      return set(baseColor, source)
    },
    setLightness: (content: ValueInput) => set(lightness, content),
    setChroma: (content: ValueInput) => set(chroma, content),
    setHue: (content: ValueInput) => set(hue, content),
    setAlpha: (content: ValueInput) => set(alpha, content),
    deltaLightness: (change: ValueInput) => set(deltas[0], change),
    deltaChroma: (change: ValueInput) => set(deltas[1], change),
    deltaHue: (change: ValueInput) => set(deltas[2], change),
    deltaAlpha: (change: ValueInput) => set(deltas[3], change),
  })
}
