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
import {
  interpretStyleConfig,
  type StyleConfigDefinition,
} from './styleConfigShortcuts'

/** 实际样式字段的效果，只接收本次选中的字段值。 */
export type StyleConfigHandler<Value> = (value: Value) => void

/** 函数定义实际效果，布尔快捷可用对象映射到字符串字段；值域始终由独立契约校验。 */
export type StyleConfig<Config> = {
  [Key in keyof Config]-?:
    | StyleConfigHandler<Exclude<Config[Key], undefined>>
    | (Exclude<Config[Key], undefined> extends boolean
        ? {
            [
              Target in keyof Config as Exclude<
                Config[Target],
                undefined
              > extends string
                ? Target
                : never
            ]?: Exclude<Config[Target], undefined>
          }
        : never)
}

/**
 * 将当前配置交给统一解释工具，并把最终实例覆盖交给对应 Piv 节点。
 * 每次重新收集，清空即撤销此前覆盖；快捷映射也只应用最终目标效果一次。
 * 一个公共配置可由根与内部节点分别绑定各自字段，其他作用域的字段不在此处解释。
 *
 * @example
 * type GapConfig = { $gap?: string }
 * const styleConfig = { $gap: (value) => gapToken.set(value) } satisfies StyleConfig<GapConfig>
 * bindStyleConfig(styleConfig, { $styleConfig: { $gap: '2rem' } })
 */
export function bindStyleConfig(
  definition: StyleConfigDefinition,
  props: {
    $styleConfig?: Source<Record<string, unknown> | undefined>
  },
): ElementDeclarations {
  const declaration: ElementDeclarations = {
    get style() {
      return collectTokenStyles(() =>
        interpretStyleConfig(definition, val(props.$styleConfig)),
      )
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
