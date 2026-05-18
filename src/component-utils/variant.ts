import { type MayState, derive } from '../hooks'

export type VariantProps<Variants extends string> = MayState<Variants>
export function useVariant<V extends string>(variantsProp: VariantProps<V>) {
  return { class: derive(variantsProp, (v) => `variant:${v}`) }
}
