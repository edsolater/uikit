/**
 * 离散标识状态与操作器。
 *
 * 负责标识的设置、循环切换和派生匹配，不负责标识对应的业务动作。
 *
 * 让标识状态通过 UIKit 的 State 与 StateView 统一读取。
 */
import { createState, val, type State, type StateView } from '@/foundation'
import { derive } from '../stateUtils'
import { createMatcher, type MatcherOperator } from './matcher'
import type { PresentPrimitive, Primitive } from '@edsolater/fnkit'

/**
 * IdentOperator
 *
 * 离散 ident 状态的操作集合。
 *
 * ident 指一组轻量、稳定、可枚举的字符串标识值。
 *
 * 适合：
 * - size: 'sm' | 'md' | 'lg'
 * - intent: 'save' | 'delete' | 'cancel'
 * - placement: 'top' | 'right' | 'bottom' | 'left'
 * - tone: 'neutral' | 'positive' | 'warning' | 'danger'
 *
 * 它接近 CSS `<custom-ident>` 的心智模型：
 * 当前值不是业务模式，不是用户选择动作，而是一个当前落位的标识符。
 */
export interface IdentOperator<Ident extends Primitive> extends MatcherOperator<Ident> {
  /**
   * 初始 ident。
   *
   * 用于 reset，也用于外部读取默认落位。
   */
  initialIdent: Ident

  /**
   * 直接设置当前 ident。
   *
   * 当没有提供候选 ident 列表时，调用方只知道“设置成某个值”，
   * 因此这里公开 set，而不强调“去往既有落位”的语义。
   */
  set: (ident: Ident) => void

  /**
   * 恢复到 initialIdent。
   */
  reset: () => void
}

export interface CycleIdentOperator<Ident extends PresentPrimitive> extends IdentOperator<Ident> {
  /**
   * 切换到指定 ident。
   *
   * 开启 cycle 后，调用方面对的是一组既有候选值，
   * 因此类型层面优先公开 to，而不再公开 set。
   */
  to: (ident: Ident) => void

  /**
   * 可循环切换的 ident 列表。
   */
  idents: [Ident, ...Ident[]]

  /**
   * 循环切换到下一个 ident。
   * 如果当前 ident 是 idents 中的最后一个，就切换到第一个。
   * 如果当前 ident 不在 idents 中，就切换到第一个。
   */
  next: () => void

  /**
   * 循环切换到上一个 ident。
   * 如果当前 ident 是 idents 中的第一个，就切换到最后一个。
   * 如果当前 ident 不在 idents 中，就切换到第一个。
   */
  prev: () => void

  /**
   * 随机切换到 idents 中的一个 ident。
   */
  random: () => void

  /**
   * 切换到第一个 ident。
   */
  toFirst: () => void

  /**
   * 切换到最后一个 ident。
   */
  toLast: () => void

  /**
   * 当前 ident 是否是第一个。
   */
  isFirst: () => boolean

  /**
   * 当前 ident 是否是最后一个。
   */
  isLast: () => boolean

  /**
   * 创建通过 val() 读取的 StateView，用于判断当前 ident 是否是第一个。
   */
  matchFirst: () => StateView<boolean>

  /**
   * 创建通过 val() 读取的 StateView，用于判断当前 ident 是否是最后一个。
   */
  matchLast: () => StateView<boolean>
}

type IdentValue<T extends Primitive = Primitive> = T
type PresentIdentValue<T extends PresentPrimitive = PresentPrimitive> = T

export type Ident<T extends IdentValue = IdentValue> = State<T>

export type CreateIdentOptions<T extends PresentIdentValue> = {
  /**
   * 可选的 ident 列表。
   *
   * 只要显式给出这组离散值，第二返回值就升级为可循环切换的 ident 操作器。
   */
  idents?: [T, ...T[]]
}

/**
 * 创建一个 ident 状态。
 *
 * 返回：
 * - 第一个值：State，通过 val() 读取当前 ident
 * - 第二个值：identifier，用于操作、判断、读取元信息
 *
 * @example
 * const [size, sizeIdentifier] = createIdent('md' as 'sm' | 'md' | 'lg')
 *
 * val(size)
 * sizeIdentifier.set('lg')
 * val(sizeIdentifier.match('lg'))
 * val(sizeIdentifier.match((value) => value === 'lg'))
 * val(sizeIdentifier.notMatch('sm'))
 * val(sizeIdentifier.notMatch((value) => value === 'sm'))
 * sizeIdentifier.is('md')
 * sizeIdentifier.isNot('sm')
 * sizeIdentifier.reset()
 */
export function createIdent<T extends PresentIdentValue>(): [ident: State<T | undefined>, identifier: IdentOperator<T | undefined>]
export function createIdent<T extends PresentIdentValue>(initialIdent: T): [ident: State<T>, identifier: IdentOperator<T>]
export function createIdent<T extends PresentIdentValue>(
  initialIdent: T,
  options: {
    idents: [T, ...T[]]
  } & CreateIdentOptions<T>,
): [ident: State<T>, identifier: Omit<IdentOperator<T>, 'set'> & Omit<CycleIdentOperator<T>, keyof IdentOperator<T>>]
export function createIdent<T extends PresentIdentValue>(
  initialIdent?: T,
  options?: CreateIdentOptions<T>,
):
  | [ident: State<T | undefined>, identifier: IdentOperator<T | undefined>]
  | [ident: State<T>, identifier: Omit<IdentOperator<T>, 'set'> & Omit<CycleIdentOperator<T>, keyof IdentOperator<T>>] {
  const ident = createState<T | undefined>(initialIdent)

  const set = (nextIdent: T | undefined) => {
    ident.set(nextIdent)
  }

  const to = (nextIdent: T | undefined) => {
    set(nextIdent)
  }

  const matcher = createMatcher(ident)

  const reset = () => {
    ident.set(initialIdent)
  }

  const identifier = {
    initialIdent,
    set,
    to,
    ...matcher,
    reset,
  } as IdentOperator<T | undefined> & { to: (ident: T | undefined) => void }

  const idents = options?.idents

  if (!idents) {
    return [ident, identifier]
  }

  const getCurrentIndex = () => {
    return idents.indexOf(val(ident) as T)
  }

  const setByIndex = (index: number) => {
    const normalizedIndex = ((index % idents.length) + idents.length) % idents.length

    ident.set(idents[normalizedIndex])
  }

  const next = () => {
    const currentIndex = getCurrentIndex()
    const nextIndex = currentIndex === -1 ? 0 : currentIndex + 1

    setByIndex(nextIndex)
  }

  const prev = () => {
    const currentIndex = getCurrentIndex()
    const prevIndex = currentIndex === -1 ? 0 : currentIndex - 1

    setByIndex(prevIndex)
  }

  const random = () => {
    const randomIndex = Math.floor(Math.random() * idents.length)

    ident.set(idents[randomIndex])
  }

  const toFirst = () => {
    ident.set(idents[0])
  }

  const toLast = () => {
    ident.set(idents[idents.length - 1])
  }

  const isFirst = () => {
    return val(ident) === idents[0]
  }

  const isLast = () => {
    return val(ident) === idents[idents.length - 1]
  }

  const matchFirst = () => {
    return derive(ident, (value) => value === idents[0])
  }

  const matchLast = () => {
    return derive(ident, (value) => value === idents[idents.length - 1])
  }

  return [
    ident as State<T>,
    {
      ...identifier,
      idents,
      next,
      prev,
      random,
      toFirst,
      toLast,
      isFirst,
      isLast,
      matchFirst,
      matchLast,
    } as Omit<IdentOperator<T>, 'set'> & Omit<CycleIdentOperator<T>, keyof IdentOperator<T>>,
  ] as [State<T>, Omit<IdentOperator<T>, 'set'> & Omit<CycleIdentOperator<T>, keyof IdentOperator<T>>]
}
