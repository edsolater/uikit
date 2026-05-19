import { createPivPlugin } from '../components'
import { type MayState, derive } from '../hooks'
import { addDefaultProps } from './defaultProps'

type Variant = string
export type VariantInput<V extends Variant> = MayState<V>

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
export type VariantProps<V extends Variant = Variant> = {
  variant?: VariantInput<V>
}

/**
 * 推荐使用 plugin 而不是业务的hooks
 * @param variantsProp 
 * @returns 
 */
export function useVariant<V extends Variant>(variantsProp: VariantInput<V>) {
  return { class: variantsProp }
}

/** 创建一个可拔插的 底层Piv的一个插件Plugin */
export function variantParser<V extends Variant>(props: VariantProps<V>, defaultVariant?: VariantInput<V>) {
  const variant = derive(props.variant, (v) => v ?? defaultVariant)
  return createPivPlugin(() => ({
    class: variant,
  }))
}
