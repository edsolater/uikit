import { useRecordedEffect } from '@edsolater/hookit'

/**
 * @todo  move to hookit
 */
export function useConsoleLog({ data, disabled }: { data: Record<string, any>; disabled?: boolean }) {
  const values = Object.values(data)
  const keys = Object.keys(data)
  useRecordedEffect((prevValues) => {
    if (disabled) return
    values.forEach((value, idx) => {
      const key = keys[idx]
      const prevValue = prevValues[idx]
      if (prevValue !== value) {
        console.log(`${key}: `, value)
      }
    })
  }, values)
}
