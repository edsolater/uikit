export function requestIdleCallback(fn: () => void): void {
  window?.requestIdleCallback?.(fn)
}
