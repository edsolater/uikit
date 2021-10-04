// declare global {
//   interface Window {
//     features?: string[]
//   }
// }
declare module globalThis {
  let features: string[] | undefined
}
export function addGlobalFeatureTag(featureTag: string) {
  globalThis.features ??= []
  globalThis.features.push(featureTag)
}
export function hasGlobalFeatureTag(featureTag: string): boolean {
  return Boolean(globalThis.features?.includes(featureTag))
}
export function removeGlobalFeatureTag(featureTag: string) {
  if (!hasGlobalFeatureTag(featureTag)) return
  const idx: number = globalThis.features!.indexOf(featureTag)
  ;(globalThis.features as string[]).splice(idx, 1)
}
