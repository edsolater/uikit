export default function requestIdleCallback(fn: () => void): void {
  window?.requestIdleCallback?.(fn)
}
