declare global {
  interface Window {
    features?: string[]
  }
}
export function addGlobalFeatureTag(featureTag: string) {
  window.features ??= []
  window.features.push(featureTag)
}
export function hasGlobalFeatureTag(featureTag: string) {
  return Boolean(window.features?.includes(featureTag))
}
export function removeGlobalFeatureTag(featureTag: string) {
  if (!hasGlobalFeatureTag(featureTag)) return
  const idx: number = window.features!.indexOf(featureTag)
  ;(window.features as string[]).splice(idx, 1)
}
