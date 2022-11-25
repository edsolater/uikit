import { useEffect, useState } from 'react'
import { MayFn } from '@edsolater/fnkit'
/**
 * use boolean flag. contain method and value it self
 * a replace of useToggle()
 */
export function useBFlag(initValue: MayFn<boolean> = false, options?: { onChange?(value: boolean): void }) {
  const [isOn, setIsOn] = useState(initValue)

  useEffect(() => {
    options?.onChange?.(isOn)
  }, [isOn])

  const flag = {
    value: isOn,
    isOff: () => !isOn,
    isOn: () => isOn,
    on: () => setIsOn(true),
    off: () => setIsOn(false),
    toggle: () => setIsOn((b) => !b),
    set: setIsOn
  }
  return flag
}
