/**
 * 组件样式配置解释与实例消费。
 *
 * 应用配置契约独立定义值域，共同层读取来源并同步调用解释实现。
 *
 * 实例覆盖交给原 Piv 样式链，组件协议不识别 Token 或映射描述。
 */
import { val, type Source } from '@/foundation'
import { collectTokenStyles } from '@/style-system/token/scope'
import type { ElementDeclarations } from '../Piv/elementDeclarations'

/** 字段解释函数只接收该字段已提供的配置值。 */
export type StyleConfigHandler<Value> = (value: Value) => void

/** 显式应用配置契约的完整解释实现，不从实现推导应用值域。 */
export type StyleConfig<Config> = {
  [Key in keyof Config]-?: StyleConfigHandler<Exclude<Config[Key], undefined>>
}

/**
 * 将当前配置交给本绑定声明的解释函数，并把覆盖交给对应 Piv 节点。
 * 未提供的字段不调用解释函数；每次重新收集，清空即撤销此前覆盖。
 * 一个公共配置可由根与内部节点分别绑定各自字段，其他作用域的字段不在此处解释。
 *
 * @example
 * type GapConfig = { $gap?: string }
 * const styleConfig = { $gap: (value) => gapToken.set(value) } satisfies StyleConfig<GapConfig>
 * bindStyleConfig(styleConfig, { $styleConfig: { $gap: '2rem' } })
 */
export function bindStyleConfig(
  definition: Partial<Record<string, StyleConfigHandler<never>>>,
  props: {
    $styleConfig?: Source<Record<string, unknown> | undefined>
  },
): ElementDeclarations {
  const declaration: ElementDeclarations = {
    get style() {
      return collectTokenStyles(() => {
        const config = val(props.$styleConfig)
        for (const [field, interpret] of Object.entries(definition)) {
          if (interpret === undefined) continue
          const value = val(config?.[field])
          // 字段值域已由独立契约约束，动态分发只调用同字段解释实现。
          if (value !== undefined) interpret(value as never)
        }
      })
    },
  }
  // 配置定义存在不等于实例声明配置；形状投射随上游和控制写入更新，不提前订阅配置值。
  return new Proxy(declaration, {
    has: (_, key) => key === 'style' && '$styleConfig' in props,
    ownKeys: () => ('$styleConfig' in props ? ['style'] : []),
    getOwnPropertyDescriptor: (_, key) =>
      key === 'style' && '$styleConfig' in props
        ? { enumerable: true, configurable: true }
        : undefined,
  })
}
