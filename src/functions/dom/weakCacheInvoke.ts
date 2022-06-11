import { AnyObj } from '@edsolater/fnkit/dist-old'

const weakRecordedRefs = new WeakSet<AnyObj>()
export function weakCacheInvoke<T extends AnyObj>(weakKey: T, weakInvokeCallback: (el: T) => void) {
  if (weakRecordedRefs.has(weakKey)) return
  weakRecordedRefs.add(weakKey)
  weakInvokeCallback(weakKey)
}
