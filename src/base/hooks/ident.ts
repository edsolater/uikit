import { type Accessor } from 'solid-js'
import { createState } from './state'

/**
 * IdentControl
 *
 * 离散 ident 状态的操作集合。
 *
 * ident 指一组轻量、稳定、可枚举的字符串标识值。
 *
 * 适合：
 * - size: 'sm' | 'md' | 'lg'
 * - intent: 'primary' | 'secondary' | 'danger'
 * - placement: 'top' | 'right' | 'bottom' | 'left'
 * - tone: 'neutral' | 'positive' | 'warning' | 'danger'
 *
 * 它接近 CSS `<custom-ident>` 的心智模型：
 * 当前值不是业务模式，不是用户选择动作，而是一个当前落位的标识符。
 */
export interface IdentControl<Ident extends string> {
  /**
   * 所有允许的 ident。
   *
   * 顺序只表示声明顺序。
   * 基础 createIdent 不默认提供 next / prev，
   * 因为不是所有 ident 都天然具有顺序语义。
   */
  idents: Ident[]

  /**
   * 初始 ident。
   *
   * 用于 reset，也用于外部读取默认落位。
   */
  initialIdent: Ident

  /**
   * 设置当前 ident。
   */
  set: (ident: Ident) => void

  /**
   * 判断当前 ident 是否等于目标 ident。
   */
  is: (ident: Ident) => boolean

  /**
   * 判断当前 ident 是否不等于目标 ident。
   */
  isNot: (ident: Ident) => boolean

  /**
   * 恢复到 initialIdent。
   */
  reset: () => void
}

export type Ident<T extends string = string> = Accessor<T>

/**
 * 创建一个 ident 状态。
 *
 * 返回：
 * - 第一个值：accessor，用于读取当前 ident
 * - 第二个值：control，用于操作、判断、读取元信息
 *
 * @example
 * const [size, sizeIdent] = createIdent(['sm', 'md', 'lg'] as const, 'md')
 *
 * size()
 * sizeIdent.set('lg')
 * sizeIdent.is('md')
 * sizeIdent.isNot('sm')
 * sizeIdent.reset()
 * sizeIdent.idents
 */
export function createIdent<T extends string>(
  idents: T[],
  initialIdent: T,
): [ident: Accessor<T>, identControl: IdentControl<T>] {
  const [ident, setIdent] = createState<T>(initialIdent)

  const set = (nextIdent: T) => {
    setIdent(nextIdent)
  }

  const is = (targetIdent: T) => {
    return ident() === targetIdent
  }

  const isNot = (targetIdent: T) => {
    return ident() !== targetIdent
  }

  const reset = () => {
    setIdent(() => initialIdent)
  }

  return [
    ident,
    {
      idents,
      initialIdent,
      set,
      is,
      isNot,
      reset,
    },
  ]
}
