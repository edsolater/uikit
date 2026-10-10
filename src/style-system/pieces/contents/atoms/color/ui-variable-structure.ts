/** 交互颜色的 Variable 状态模板；变量的名称、注册与创建由调用处决定。 */
import type { ValueInput } from '@/style-system/value'
import type { VariableStateValues } from '@/style-system/variable-args-parser'
import { add } from '@/style-system/pieces/contents/functions/calc'
import { oklch } from '@/style-system/pieces/contents/functions/oklch'

/**
 * 返回默认颜色及 hover、active 配方，始终引用 base 的当前颜色。
 * 响应参数是变化量的无单位倍率：0 不变化，1 使用原幅度，2 使用两倍幅度。
 * 明度默认分别减 0.04、0.08；彩度默认不变，倍率 1 时分别加 0.01、减 0.01。
 * @example variable(interactiveColorStates({ base: brandColor, chromaResponse: 1 }), 'action-color')
 */
export function interactiveColorStates({
  base,
  lightnessResponse = 1,
  chromaResponse = 0,
}: {
  base: ValueInput
  lightnessResponse?: number
  chromaResponse?: number
}): VariableStateValues<ValueInput> {
  const state = (lightnessDelta: number, chromaDelta: number) => oklch(base, {
    lightness: current => add(current, lightnessDelta * lightnessResponse),
    chroma: chromaResponse === 0 ? undefined : current => add(current, chromaDelta * chromaResponse),
  })
  return {
    default: base,
    hover: state(-0.04, 0.01),
    active: state(-0.08, -0.01),
  }
}
