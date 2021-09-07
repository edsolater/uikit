import { useEffect, useState } from 'react'
import { MayFunction } from '../typings/tools'
/**
 * use boolean flag. contain method and value it self
 * a replace of useToggle()
 */
export default function useBFlag(
  initValue: MayFunction<boolean> = false,
  options?: { onChange?(value: boolean): void }
) {
  const [isOn, setIsOn] = useState(initValue)

  useEffect(() => {
    options?.onChange?.(isOn)
  }, [isOn])

  return {
    value: isOn,
    on: () => setIsOn(true),
    off: () => setIsOn(false),
    toggle: () => setIsOn((b) => !b),
    set: setIsOn
  }
}
