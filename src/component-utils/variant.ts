import { type MayState, derive } from '../hooks'

export type VariantInput<Variants extends string> = MayState<Variants>

/**
 * 用于定义props
 * Variant 意为风格变种，区别在表达信息的 维度/层次 不同 
 *
 * 示例：
 * ```ts
 * interface ButtonProps extends VariantProps<'solid' | 'outline' | 'ghost'> {
 *   // ...
 * }
 */
export type VariantProps<Variants extends string> = {
  variant?: VariantInput<Variants>
}
export function useVariant<V extends string>(variantsProp: VariantInput<V>) {
  return { class: derive(variantsProp, (v) => `variant:${v}`) }
}
