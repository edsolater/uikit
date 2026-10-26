/** 交互颜色的 Token 状态模板；名称、注册与创建由调用处决定。 */
import type { TokenInput, TokenStateValues } from '../../../../token'
import { add } from '../../functions/calc'
import { oklch } from '../../functions/oklch'

/**
 * 返回默认颜色及 hover、active 配方，始终引用 base 的当前颜色。
 * 响应参数是变化量的无单位倍率：0 不变化，1 使用原幅度，2 使用两倍幅度。
 * 明度默认分别减 0.04、0.08；彩度默认不变，倍率 1 时分别加 0.01、减 0.01。
 * @example token(interactiveColorStates({ base: brandColor, chromaResponse: 1 }), 'action-color')
 */
export function interactiveColorStates({
  base,
  lightnessResponse = 1,
  chromaResponse = 0,
}: {
  base: TokenInput
  lightnessResponse?: number
  chromaResponse?: number
}): TokenStateValues<TokenInput> {
  const state =
    (lightnessDelta: number, chromaDelta: number) =>
    (currentBase: TokenInput) =>
      oklch(currentBase, {
        lightness: (current) =>
          add(current, lightnessDelta * lightnessResponse),
        chroma:
          chromaResponse === 0
            ? undefined
            : (current) => add(current, chromaDelta * chromaResponse),
      })
  return {
    default: base,
    hover: state(-0.04, 0.01),
    active: state(-0.08, -0.01),
  }
}
