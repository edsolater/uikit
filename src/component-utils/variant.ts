import { createPivPlugin } from '../components'
import { type Source, state } from '../hooks'
import type { PluginManager } from './type'

type Variant = string
export type VariantInput<V extends Variant> = Source<V>

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

/** 创建一个可拔插的 底层Piv的一个插件Plugin */
export function createVariantManager<V extends Variant>(
  props: VariantProps<V>,
  options?: { defaultVariant?: VariantInput<V> },
) {
  const variant = state(props.variant).map((v) => v ?? options?.defaultVariant)
  const variantPlugin = createPivPlugin(() => ({
    class: variant,
  }))
  return { details: { variant }, plugin: variantPlugin } satisfies PluginManager
}
