import { createMemo, type Accessor } from 'solid-js'
import { createState } from '../lv0-state'
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
 * - intent: 'primary' | 'secondary' | 'danger'
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
  idents: readonly [Ident, ...Ident[]]

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
   * 创建响应式 accessor，用于判断当前 ident 是否是第一个。
   */
  matchFirst: () => Accessor<boolean>

  /**
   * 创建响应式 accessor，用于判断当前 ident 是否是最后一个。
   */
  matchLast: () => Accessor<boolean>
}

type IdentValue<T extends Primitive = Primitive> = T
type PresentIdentValue<T extends PresentPrimitive = PresentPrimitive> = T

export type Ident<T extends IdentValue = IdentValue> = Accessor<T>

export type CreateIdentOptions<T extends PresentIdentValue> = {
  /**
   * 可选的 ident 列表。
   *
   * 只要显式给出这组离散值，第二返回值就升级为可循环切换的 ident 操作器。
   */
  idents?: readonly [T, ...T[]]
}

/**
 * 创建一个 ident 状态。
 *
 * 返回：
 * - 第一个值：accessor，用于读取当前 ident
 * - 第二个值：identifier，用于操作、判断、读取元信息
 *
 * @example
 * const [size, sizeIdentifier] = createIdent('md' as 'sm' | 'md' | 'lg')
 *
 * size()
 * sizeIdentifier.set('lg')
 * sizeIdentifier.match('lg')()
 * sizeIdentifier.match((value) => value === 'lg')()
 * sizeIdentifier.notMatch('sm')()
 * sizeIdentifier.notMatch((value) => value === 'sm')()
 * sizeIdentifier.is('md')
 * sizeIdentifier.isNot('sm')
 * sizeIdentifier.reset()
 */
export function createIdent<T extends PresentIdentValue>(): [ident: Accessor<T | undefined>, identifier: IdentOperator<T | undefined>]
export function createIdent<T extends PresentIdentValue>(initialIdent: T): [ident: Accessor<T>, identifier: IdentOperator<T>]
export function createIdent<T extends PresentIdentValue>(
  initialIdent: T,
  options: {
    idents: readonly [T, ...T[]]
  } & CreateIdentOptions<T>,
): [ident: Accessor<T>, identifier: Omit<IdentOperator<T>, 'set'> & Omit<CycleIdentOperator<T>, keyof IdentOperator<T>>]
export function createIdent<T extends PresentIdentValue>(
  initialIdent?: T,
  options?: CreateIdentOptions<T>,
): [ident: Accessor<T | undefined>, identifier: IdentOperator<T | undefined> | (Omit<IdentOperator<T>, 'set'> & Omit<CycleIdentOperator<T>, keyof IdentOperator<T>>)] {
  const [ident, setIdent] = createState<T | undefined>(initialIdent)

  const set = (nextIdent: T | undefined) => {
    setIdent(nextIdent)
  }

  const to = (nextIdent: T | undefined) => {
    set(nextIdent)
  }

  const matcher = createMatcher(ident)

  const reset = () => {
    setIdent(initialIdent)
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
    return idents.indexOf(ident() as T)
  }

  const setByIndex = (index: number) => {
    const normalizedIndex = ((index % idents.length) + idents.length) % idents.length

    setIdent(idents[normalizedIndex])
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

    setIdent(idents[randomIndex])
  }

  const toFirst = () => {
    setIdent(idents[0])
  }

  const toLast = () => {
    setIdent(idents[idents.length - 1])
  }

  const isFirst = () => {
    return ident() === idents[0]
  }

  const isLast = () => {
    return ident() === idents[idents.length - 1]
  }

  const matchFirst = () => {
    return createMemo(isFirst)
  }

  const matchLast = () => {
    return createMemo(isLast)
  }

  return [
    ident as Accessor<T>,
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
  ]
}
