import { createPivPlugin } from '../Piv/plugin/helpers'
import { stateView, type Source } from '@/foundation'
import type { PluginManager } from './type'

type Variant = string
export type VariantInput<V extends Variant> = Source<V>

/**
 * 用于定义props
 * Variant 意为风格变种，区别在表达信息的 维度/层次 不同
 *
 * 示例：
 * ```ts
 * interface ButtonProps extends VariantManagerProps<'solid' | 'outline' | 'ghost'> {
 *   // ...
 * }
 */
export type VariantManagerProps<V extends Variant = Variant> = {
  variant?: VariantInput<V>
}

/** 创建一个可拔插的 底层Piv的一个插件Plugin */
export function createVariantManager<V extends Variant>(
  props: VariantManagerProps<V>,
  options?: { defaultVariant?: VariantInput<V> },
) {
  const variant = stateView(props.variant).map((v) => v ?? options?.defaultVariant)
  const variantPlugin = createPivPlugin(() => ({
    class: variant,
  }))
  return [ { variant }, variantPlugin ] satisfies PluginManager
}
