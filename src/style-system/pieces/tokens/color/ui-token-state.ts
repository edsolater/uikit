/** 可组合的交互颜色状态定义。 */
import type { TokenInput } from '../../../token'
import { add } from '../../functions/calc'
import { oklch } from '../../functions/oklch'

/**
 * 返回独立的 hover、active 配方，基础颜色由接收这些状态的 Token 提供。
 * 响应参数是变化量的无单位倍率：0 不变化，1 使用原幅度，2 使用两倍幅度。
 * 明度默认分别减 0.04、0.08。
 * 彩度默认不变，倍率 1 时分别加 0.01、减 0.01。
 *
 * @example
 * token(
 *   brandColor,
 *   { name: 'action-color', state: interactiveColorStates({ chromaResponse: 1 }) },
 * )
 */
export function interactiveColorStates({
  lightnessResponse = 1,
  chromaResponse = 0,
}: {
  lightnessResponse?: number
  chromaResponse?: number
} = {}) {
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
    hover: state(-0.04, 0.01),
    active: state(-0.08, -0.01),
  }
}
