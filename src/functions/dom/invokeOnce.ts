import { AnyObj } from '@edsolater/fnkit'

const weakRecordedRefs = new WeakSet<AnyObj>()
export function invokeOnce<T extends AnyObj>(weakKey: T, weakInvokeCallback: (el: T) => void) {
  if (weakRecordedRefs.has(weakKey)) return
  weakRecordedRefs.add(weakKey)
  weakInvokeCallback(weakKey)
}
