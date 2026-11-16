/**
 * 这个文件组织 Piv 的声明来源并形成合并后的 Props。
 *
 * 创建前先展开已构建的 Plugin 声明与嵌套 is，再统一解析 as／if 等结构字段；
 * 直接 Props 优先，shadowProps 数组后项优先，每份声明先于其嵌套 shadowProps。
 * 它只产出声明数据，不消费 class、style、HTML props、事件或 domRef。
 */
import { mergeMayArray, toArray, type MayArray } from '@edsolater/fnkit'
import { val } from '@/foundation'
import { createMemo } from '@/foundation/reactivity'
import type { PivProps } from '../Piv'
import type { PivTag } from '../domMap'
import { readPlugin } from '../../plugins/tools/createInactivePlugin'

/** 创建前可转交的统一补充声明，包含 as、if、domRef、is；children 仍由直接 Props 提供。 */
export type ShadowProps<Tag extends PivTag> = Omit<PivProps<Tag>, 'children'>

/**
 * 在创建宿主之前收集 Props 中的补充声明，不包含传入的 Props 自身。
 *
 * 已构建 Plugin 作为补充声明展开，不执行业务 core；嵌套 is 继续按同一队列展开。
 */
export function collectShadowProps<Tag extends PivTag>(
  props: ShadowProps<Tag>,
): ShadowProps<Tag>[] {
  const declarations: ShadowProps<Tag>[] = []
  const queue = readNestedShadowProps(props)

  while (queue.length > 0) {
    const item = queue.pop()!
    declarations.push(item)
    queue.push(...readNestedShadowProps(item))
  }

  return declarations
}

/**
 * 收集一份声明携带的嵌套 shadowProps 与 is，保持原声明顺序。
 * is 按 PluginInput 识别后转成补充声明，不在这里消费节点能力。
 */
function readNestedShadowProps<Tag extends PivTag>(
  props: ShadowProps<Tag>,
): ShadowProps<Tag>[] {
  const declarations: ShadowProps<Tag>[] = []
  // 缺字段的 Director getter 会建立 State，收集来源时必须先看声明，而不是读取空值后再过滤。
  if ('shadowProps' in props) declarations.push(...toArray(props.shadowProps))
  if ('is' in props) {
    for (const input of toArray(props.is)) {
      declarations.push(readPlugin(input) as ShadowProps<Tag>)
    }
  }
  return declarations
}

/**
 * 合并 Piv 的声明来源，供 Dode 读取字段。
 *
 * 插件在任一字段被读取前展开，因此 addProps 提交的 as／if 与 shadowProps 一样参与
 * 创建前结构选择；所有字段仍沿用原来源优先级与合并规则。
 */
export function mergePivProps<Tag extends PivTag>(
  props: PivProps<Tag>,
): PivProps<Tag> {
  const readSources = createMemo(() => [props, ...collectShadowProps(props)])
  return createMergedProps(props, readSources)
}

/**
 * 为整合后的声明建立按需读取的字段视图，不提前创建字段的派生来源。
 * 读取最新完整声明，字段合并仍沿低优先级到高优先级的原顺序。
 */
function createMergedProps<Tag extends PivTag>(
  props: PivProps<Tag>,
  readSources: () => ShadowProps<Tag>[],
): PivProps<Tag> {
  const readProperty = (key: keyof PivProps<Tag>) => {
    if (key === 'children') return props.children
    if (key === 'as') {
      for (const source of readSources()) {
        // 跳过未声明来源，避免仅为选择标签建立其控制 State。
        if (!('as' in source)) continue
        const tag = source.as
        if (tag !== undefined) return tag
      }
      return undefined
    }
    if (key === 'if') return readSources().find((source) => 'if' in source)?.if
    return mergePivPropValue(readSources(), key)
  }
  const hasProperty = (key: PropertyKey) =>
    key === 'children'
      ? key in props
      : readSources().some((source) => key in source)
  return new Proxy(
    {},
    {
      get: (_, key) => readProperty(key as keyof PivProps<Tag>),
      has: (_, key) => hasProperty(key),
      ownKeys: () => [
        ...new Set(
          readSources().flatMap((source) =>
            Object.keys(source).filter(
              (key) => key !== 'children' || source === props,
            ),
          ),
        ),
      ],
      getOwnPropertyDescriptor: (_, key) =>
        hasProperty(key)
          ? {
              enumerable: true,
              configurable: true,
              get: () => readProperty(key as keyof PivProps<Tag>),
            }
          : undefined,
    },
  ) as PivProps<Tag>
}

/**
 * 只从实际声明该字段的来源读取并合并值。
 * Source 在消费作用域读取，事件回调等普通函数保持原值。
 */
function mergePivPropValue<
  Tag extends PivTag,
  Key extends keyof ShadowProps<Tag>,
>(sources: ShadowProps<Tag>[], key: Key): ShadowProps<Tag>[Key]
function mergePivPropValue<Tag extends PivTag>(
  sources: ShadowProps<Tag>[],
  key: keyof ShadowProps<Tag>,
): unknown {
  let firstValue: unknown = undefined
  let values: unknown[] | undefined

  for (let index = sources.length - 1; index >= 0; index--) {
    // 某个来源声明字段，不代表其它来源也声明；缺字段的受控 getter 不应被激活。
    if (!(key in sources[index])) continue
    const rawValue = sources[index][key]
    if (rawValue === undefined) continue
    const value: unknown = val(rawValue)
    if (firstValue === undefined) firstValue = value
    else (values ??= [firstValue]).push(value)
  }

  return values ? mergeMayArray(...values) : firstValue
}
