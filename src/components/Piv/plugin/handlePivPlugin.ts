/**
 * 这个文件定义 Piv plugin 的展开和合并规则。
 * plugin 可以返回低优先级 shadow props；用户直接传入的 props 始终覆盖 plugin 结果。
 * 它只产出声明数据，不消费 class、style、HTML props、事件或 domRef。
 */
import {
  mayMap,
  mergeMayArray,
  toArray,
  type ID,
  type MayArray,
} from '@edsolater/fnkit'
import { val, type StateView } from '@/foundation'
import { derive } from '@/hooks/stateUtils'
import type { PivProps } from '../Piv'
import type { PivHTMLElement, PivTag } from '../domMap'
import { runPlugin, type PivPlugin } from './runPlugin'
import { getPublicPluginSources } from './publicCapabilities'
import { mapArray } from '@/foundation/render'
import { createMemo } from '@/foundation/reactivity'

/** 创建前可转交的声明，包含 as/if；children 仍由直接 Props 提供。 */
export type PivShadowProps<Tag extends PivTag> = Omit<PivProps<Tag>, 'children'>

/** DOM 创建后插件可补充的声明，不反向控制 as、if 或 children。 */
export type ShadowProps<Tag extends PivTag> = Omit<
  PivProps<Tag>,
  'as' | 'if' | 'children' | 'shadowProps'
> & {
  shadowProps?: MayArray<ShadowProps<Tag>>
}

/**
 * 组织创建前可用的纯 shadowProps，只保留结构字段的惰性读取。
 * shadowProps 没有结构字段时复用原声明；直接来源优先，shadow 数组后项优先。
 */
export function getPivStructureProps<Tag extends PivTag>(rawProps: PivProps<Tag>) {
  const shadows = rawProps.shadowProps
  if (!shadows) return rawProps
  const sources = collectStructureSources(shadows)
  if (!sources) return rawProps
  sources.unshift(rawProps)
  const structure: Pick<PivProps<Tag>, 'as' | 'if' | 'children'> = {
    get as() {
      for (const source of sources) {
        const tag = source.as
        if (tag !== undefined) return tag
      }
      return undefined
    },
    get children() {
      return rawProps.children
    },
  }
  const condition = sources.find((source) => 'if' in source)
  if (condition) {
    Object.defineProperty(structure, 'if', {
      enumerable: true,
      get: () => condition.if,
    })
  }
  return structure
}

/**
 * 按现有优先关系收集具有 as/if 的来源，仅实际遇到结构字段时建立列表。
 * 不读取字段值或执行插件，数组空位与缺省来源不参与。
 */
function collectStructureSources<Tag extends PivTag>(
  props: MayArray<PivShadowProps<Tag>> | undefined,
  sources?: PivShadowProps<Tag>[],
) {
  if (Array.isArray(props)) {
    for (let index = props.length - 1; index >= 0; index--) {
      sources = collectStructureSources(props[index], sources)
    }
  } else if (props) {
    if ('as' in props || 'if' in props) (sources ??= []).push(props)
    const shadows = props.shadowProps
    if (shadows) sources = collectStructureSources(shadows, sources)
  }
  return sources
}

/** id 是持续合并声明的稳定派生来源，其余字段保持原有输入契约。 */
type MergedPivProps<Tag extends PivTag> = Omit<ShadowProps<Tag>, 'id'> & {
  id?: StateView<MayArray<ID> | undefined>
}

/**
 * 把直接 props、shadowProps、is 和 plugin 返回值整合成 Piv 最终消费的 props。
 * id 输出稳定的合并 Source；class、style、htmlProps 保留用于声明解析和字段作用域的惰性读取。
 */
export function mergePivProps<Tag extends PivTag>(
  element: PivHTMLElement<Tag>,
  rawProps: ShadowProps<Tag>,
): MergedPivProps<Tag> {
  const rawPropsList = [
    rawProps,
    ...expandPlugins(getPluginFromShadowProps(rawProps), element),
  ]
  const pluginSources = getPublicPluginSources(rawPropsList)
  const injected = mapArray(
    () =>
      pluginSources
        .map((source) => val(source))
        .filter((plugin): plugin is PivPlugin<Tag> => plugin !== undefined),
    (plugin) => expandPlugins([plugin], element),
  )
  // 声明结构变化时才重新汇总；字段仍在消费时读取。
  const declarations = createMemo(() => [...rawPropsList, ...injected().flat()])
  return createMergedProps(declarations)
}

/** 插件展开共用同一执行栈，保持原顺序与返回协议。 */
function expandPlugins<Tag extends PivTag>(
  plugins: PivPlugin<Tag>[],
  element: PivHTMLElement<Tag>,
) {
  const declarations: ShadowProps<Tag>[] = []
  const pluginsQueue = [...plugins]

  while (pluginsQueue.length > 0) {
    const plugin = pluginsQueue.pop()
    if (!plugin) continue
    const result = runPlugin(plugin, element)
    if (result) {
      const newDeepQueueFromResult = getPluginFromShadowProps(result)
      pluginsQueue.push(...newDeepQueueFromResult)
      declarations.push(result)
    }
  }

  return declarations
}

/** 把一份 raw props 携带的 is 和 shadowProps 归一成待执行 plugin 队列。 */
function getPluginFromShadowProps<Tag extends PivTag>(
  props: ShadowProps<Tag>,
): PivPlugin<Tag>[] {
  return toArray(
    mayMap(props.shadowProps, (shadow) => () => shadow),
    props.is,
  )
}

/**
 * 为整合后的 props 建立 id 来源与其他字段的 getter。
 * 读取最新完整声明，字段合并仍沿低优先级到高优先级的原顺序。
 */
function createMergedProps<Tag extends PivTag>(
  readDeclarations: () => ShadowProps<Tag>[],
): MergedPivProps<Tag> {
  const id = derive([readDeclarations], ([read]) =>
    mergePivPropValue(read(), 'id'),
  )
  const readProperty = (key: keyof ShadowProps<Tag>) =>
    key === 'id' ? id : mergePivPropValue(readDeclarations(), key)
  const hasProperty = (key: PropertyKey) =>
    readDeclarations().some((props) => key in props)
  return new Proxy(
    {},
    {
      get: (_, key) => readProperty(key as keyof ShadowProps<Tag>),
      has: (_, key) => hasProperty(key),
      ownKeys: () => [
        ...new Set(readDeclarations().flatMap((props) => Object.keys(props))),
      ],
      getOwnPropertyDescriptor: (_, key) =>
        hasProperty(key)
          ? {
              enumerable: true,
              configurable: true,
              get: () => readProperty(key as keyof ShadowProps<Tag>),
            }
          : undefined,
    },
  ) as MergedPivProps<Tag>
}

/** 读取并合并一个字段；val 只解包 StateView，事件回调等普通函数会保持原值。 */
function mergePivPropValue<Tag extends PivTag>(
  rawPropsList: ShadowProps<Tag>[],
  key: 'id',
): MayArray<ID> | undefined
function mergePivPropValue<
  Tag extends PivTag,
  Key extends keyof ShadowProps<Tag>,
>(rawPropsList: ShadowProps<Tag>[], key: Key): ShadowProps<Tag>[Key]
function mergePivPropValue<Tag extends PivTag>(
  rawPropsList: ShadowProps<Tag>[],
  key: keyof ShadowProps<Tag>,
): unknown {
  let firstValue: unknown = undefined
  let values: unknown[] | undefined

  for (let index = rawPropsList.length - 1; index >= 0; index--) {
    const rawValue = rawPropsList[index][key]
    if (rawValue === undefined) continue
    const value: unknown = val(rawValue)
    if (firstValue === undefined) firstValue = value
    else (values ??= [firstValue]).push(value)
  }

  return values ? mergeMayArray(...values) : firstValue
}
