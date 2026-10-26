/** CSS 动画内容与按需帧定义。 */
import { assert, isString } from '@edsolater/fnkit'
import { condition } from '../../../condition'
import type { Rules } from '../../../rule'
import { token, type Token, type TokenInput } from '../../../token/core'

/** 动画名称；使用时提供帧定义。 */
export function animationName(name: string, frames: Rules): Token {
  assert(isString(name), 'animationName 的名称必须是字符串。')
  return token(name, { onFirstScan: () => [[[condition(`@keyframes ${name}`)], undefined, frames]] })
}

/** 单条动画配置。 */
export interface AnimationParts {
  name: TokenInput
  duration: TokenInput
  easing?: TokenInput
  delay?: TokenInput
  iterations?: TokenInput
  direction?: TokenInput
  fillMode?: TokenInput
  playState?: TokenInput
}

/** 延迟生成动画内容。 */
export function animationValue(parts: AnimationParts): Token {
  return token({ default: parts }, { dependencies: current => Object.values(current), toCSSString: (current, resolve) => [
    resolve(current.name), resolve(current.duration), resolve(current.easing), resolve(current.delay),
    resolve(current.iterations), resolve(current.direction), resolve(current.fillMode), resolve(current.playState),
  ].filter((part) => part !== undefined).join(' ') })
}
