const invokeTimeRecord = new Map<string, { timestampCount: number; lastTimestamp: number }>()
const maxInvokeCountInSameTimestamp = 5
/**
 *
 * @param key for record
 */
export function assertFunctionNotInvokeTooFrequently(key: string) {
  const record = (() => {
    if (!invokeTimeRecord.has(key)) {
      invokeTimeRecord.set(key, { timestampCount: 0, lastTimestamp: Date.now() })
    }
    return invokeTimeRecord.get(key)!
  })()
  const now = Date.now()
  record.timestampCount = Math.abs(record.lastTimestamp - now) < 10 ? record.timestampCount + 1 : 0
  record.lastTimestamp = now
  if (record.timestampCount > maxInvokeCountInSameTimestamp) {
    throw new Error(`Function[${key}] invoke too frequently, (max ${maxInvokeCountInSameTimestamp} times each second)`)
  }
}
