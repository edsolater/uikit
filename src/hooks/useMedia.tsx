import { useLayoutEffect, useState } from 'react'

/**
 * @see https://usehooks.com/useMedia/
 */
export function useMedia<T>(queries: string[] | string, values: T[], defaultValue: T): T
export function useMedia<T>(queries: string[] | string, values: T[], defaultValue?: undefined): T | undefined
export function useMedia<T>(queries: string[] | string, values: T[], defaultValue?: T) {
  const [value, setValue] = useState(defaultValue)
  useLayoutEffect(() => {
    const mediaQueryLists = [queries]
      .flat()
      .map((q) => globalThis.matchMedia?.(q))
      .filter(Boolean)
    const getValue = () => values[mediaQueryLists.findIndex((mql) => mql.matches)] ?? defaultValue
    setValue(getValue)

    const handler = () => setValue(getValue)
    mediaQueryLists.forEach((mql) => mql.addEventListener('change', handler))
    return () => mediaQueryLists.forEach((mql) => mql.removeEventListener('change', handler))
  }, [])
  return value
}
