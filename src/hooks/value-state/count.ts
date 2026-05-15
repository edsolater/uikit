import { createState, type State } from '../base-state'

/**
 * CounterControl
 *
 * 整数计数器的操作集合。
 *
 * 适合：
 * - count
 * - retryCount
 * - clickCount
 * - renderCount
 * - selectedCount
 *
 * 它不是任意 number 状态，而是一个围绕“整数计数”建立的状态工具。
 */
export interface CounterControl {
  /**
   * 初始计数值。
   *
   * 用于 reset，也用于外部读取默认计数。
   */
  initialCount: number

  /**
   * 设置当前计数。
   *
   * 注意：
   * - createCounter 语义上表示整数计数器
   * - 因此这里会把输入值规整为整数
   */
  set: (count: number) => void

  /**
   * 增加计数。
   *
   * 默认增加 1。
   */
  increase: (delta?: number) => void

  /**
   * 减少计数。
   *
   * 默认减少 1。
   */
  decrease: (delta?: number) => void

  /**
   * 判断当前计数是否等于目标值。
   */
  is: (count: number) => boolean

  /**
   * 判断当前计数是否不等于目标值。
   */
  isNot: (count: number) => boolean

  /**
   * 恢复到 initialCount。
   */
  reset: () => void
}

/**
 * 将任意 number 规整为整数。
 *
 * 这里使用 Math.trunc：
 * - 1.9  -> 1
 * - -1.9 -> -1
 *
 * 比 Math.floor 更符合“去掉小数部分”的直觉。
 */
function toInteger(value: number): number {
  return Math.trunc(value)
}

/**
 * 创建一个整数计数器。
 *
 * 返回：
 * - 第一个值：accessor，用于读取当前 count
 * - 第二个值：counter，用于操作这个 count
 *
 * @example
 * const [count, counter] = createCounter(0)
 *
 * count()
 * counter.increase()
 * counter.decrease()
 * counter.set(10)
 * counter.reset()
 */
export function createCounter(initialCount = 0): [count: State<number>, counter: CounterControl] {
  const normalizedInitialCount = toInteger(initialCount)

  const [count, setCount] = createState(normalizedInitialCount)

  const set = (nextCount: number) => {
    setCount(toInteger(nextCount))
  }

  const increase = (delta = 1) => {
    setCount((currentCount) => {
      return toInteger(currentCount + delta)
    })
  }

  const decrease = (delta = 1) => {
    setCount((currentCount) => {
      return toInteger(currentCount - delta)
    })
  }

  const is = (targetCount: number) => {
    return count() === toInteger(targetCount)
  }

  const isNot = (targetCount: number) => {
    return count() !== toInteger(targetCount)
  }

  const reset = () => {
    setCount(normalizedInitialCount)
  }

  return [
    count,
    {
      initialCount: normalizedInitialCount,
      set,
      increase,
      decrease,
      is,
      isNot,
      reset,
    },
  ]
}
