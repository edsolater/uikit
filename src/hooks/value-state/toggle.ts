import { createState } from '../createState'
import type { State } from '../createState'

/**
 * ToggleControl
 *
 * boolean 二态状态的操作集合。
 *
 * 适合：
 * - enabled / disabled
 * - open / closed
 * - active / inactive
 * - checked / unchecked
 *
 * 它不是普通 flag，而是一个可操作的二态开关。
 */
export interface ToggleControl {
  /**
   * 初始值。
   *
   * 用于 reset，也用于外部读取这个 toggle 的默认状态。
   */
  initialValue: boolean

  /**
   * 设置为 true。
   */
  turnOn: () => void

  /**
   * 设置为 false。
   */
  turnOff: () => void

  /**
   * 在 true / false 之间切换。
   */
  toggle: () => void

  /**
   * 恢复到 initialValue。
   */
  reset: () => void
}

export type Toggle = State<boolean>

/**
 * 创建一个 boolean 二态开关状态。
 *
 * 返回：
 * - 第一个值：accessor，用于读取当前 boolean
 * - 第二个值：control，用于操作这个 boolean
 *
 * @example
 * const [visible, visibleToggle] = createToggle(false)
 *
 * visible()
 * visibleToggle.turnOn()
 * visibleToggle.turnOff()
 * visibleToggle.toggle()
 * visibleToggle.reset()
 */
export function createToggle(initialValue: boolean = false): [toggle: State<boolean>, toggleControl: ToggleControl] {
  const toggle = createState(initialValue)

  const turnOn = () => {
    toggle.set(true)
  }

  const turnOff = () => {
    toggle.set(false)
  }

  const toggleValue = () => {
    toggle.set((currentValue: boolean) => !currentValue)
  }

  const reset = () => {
    toggle.set(initialValue)
  }

  return [
    toggle,
    {
      initialValue,
      turnOn,
      turnOff,
      toggle: toggleValue,
      reset,
    },
  ]
}
