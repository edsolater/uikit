/**
 * 组织组件的直接声明、shadowProps 与 is，并在读取时认领字段。
 *
 * 原始数据共享；只有自动交接携带消费状态。先读取者取得声明，同层重复读取仍可用。
 * 下层遵守本接口，不通过展开原始对象恢复已经消费的字段。
 */
import type { MayArray } from '@edsolater/fnkit'
import { createState, type StateView } from '@/foundation'
import { createMemo, untrack } from '@/foundation/reactivity'
import { collectPluginDeclarations } from './plugins'
import type { PluginInput } from '../../plugins/tools/createInactivePlugin'

/** 组件共同拥有的补充声明入口，具体字段来自接收层的 Props。 */
export interface PropsDeclarationInput<Props extends object = object> {
  shadowProps?: MayArray<
    Partial<Omit<Props, 'children' | 'ref' | 'shadowProps' | 'is'>> &
      PropsDeclarationInput<Props>
  >
  is?: MayArray<PluginInput>
}

/** 单字段的来源保留惰性，普通字段不执行 Source。 */
export interface PropSource {
  has(key: PropertyKey): boolean
  read(key: PropertyKey): unknown
  /** 已处理的上层同时交付输出与原声明是否终止低优先级来源，不能从完成值反推。 */
  readContribution?(key: PropertyKey): PropContribution
}

/** 一份来源的现有输出，以及独立于完成值的声明截断事实。 */
export interface PropContribution {
  value: unknown
  stopsLower: boolean
}

/** 本次字段选择保留终止位置；values 内仍是未求值的原 Source 或上层输出。 */
export interface PropSelection {
  values: readonly unknown[]
  stopsLower: boolean
}

/** 字段拥有者提供完整累加规则；选择原始参与者与读取完成值分开，保留 Source 惰性。 */
export interface PropAccumulation {
  matches(key: PropertyKey): boolean
  collect(
    key: PropertyKey,
    sources: readonly PropSource[],
    direct?: PropSource,
  ): PropSelection
  merge(sources: readonly unknown[]): unknown
}

/** 字段拥有者可以指定累加规则，默认选最高优先级的已声明来源。 */
export interface PropsDeclarationOptions {
  /** 累加字段随实际读取认领来源；普通覆盖字段预先认领实际选中的来源。 */
  accumulate?: PropAccumulation
}

/** 本层供基础设施探测、核心消费和显式交接使用的同一份声明入口。 */
export interface PropsDeclaration<Props extends object> {
  /** 控制设施使用本层直接声明，不以合并结果替代直接贡献。 */
  readonly input: Props
  readonly peek: Props
  accumulates(key: PropertyKey): boolean
  consume(): Props
  consume<View extends object>(view: View): View
  claim(key: PropertyKey): boolean
  /** 输入设施复用当前来源图读取字段，可用本地直接声明替换首层贡献，不改变原输入归属。 */
  read<Key extends keyof Props>(key: Key, direct?: PropSource): Props[Key]
  read(key: PropertyKey, direct?: PropSource): unknown
  /** 为累加字段建立来源，沿当前消费身份选择参与者；实例设施负责缓存视图。 */
  createAccumulatedSource(
    key: PropertyKey,
    direct?: PropSource,
  ): StateView<unknown>
}

interface DeclarationScope {
  hasInput(key: PropertyKey): boolean
  has(key: PropertyKey, reader: object): boolean
  claim(key: PropertyKey, reader: object): boolean
  read(key: PropertyKey, reader: object, consume: boolean): unknown
  readContribution(
    key: PropertyKey,
    reader: object,
    consume: boolean,
  ): PropContribution
  keys(): PropertyKey[]
}

interface DeclarationSource extends PropSource {
  source: object
  upstream?: DeclarationScope
}

// 只关联视图与其本次传递作用域；不把共享原对象标记成已消费。
const scopes = new WeakMap<object, DeclarationScope>()
/**
 * 查询当前层的输入声明，不把本层默认来源或 Controller 写入当成外部声明。
 * 上层交付的视图仍是一份完整输入，沿正常交接协议判断，不穿透它的内部来源。
 */
export function hasPropDeclaration(props: object, key: PropertyKey): boolean {
  return scopes.get(props)?.hasInput(key) ?? key in props
}
/**
 * 解析入口由本层接管，不作为普通字段在层间重复展开。
 */
const isProtocolKey = (key: PropertyKey) =>
  key === 'is' || key === 'shadowProps'

/**
 * 建立本层的声明读取与消费入口。
 * peek 仅供 Kit 内部探测和建立 Source；业务核心使用 consume 返回的 Props。
 *
 * @example
 * const parent = createPropsDeclaration({ disabled: true })
 * const props = parent.consume()
 * props.disabled // 本层认领，但不改原对象。
 * const child = createPropsDeclaration<{ disabled?: boolean }>({ shadowProps: props }).consume()
 * child.disabled // undefined；显式传 disabled: props.disabled 可以重新交付。
 */
export function createPropsDeclaration<Props extends object>(
  input: Props,
  options?: PropsDeclarationOptions,
): PropsDeclaration<Props>
export function createPropsDeclaration<Props extends object>(
  input: Props & PropsDeclarationInput<Props>,
  options?: PropsDeclarationOptions,
): PropsDeclaration<Props>
export function createPropsDeclaration<Props extends object>(
  input: Props,
  options: PropsDeclarationOptions = {},
): PropsDeclaration<Props> {
  const claims = new Map<PropertyKey, object>()
  // 普通读取记录本字段这一次合并的终止事实；不保存第二份字段值。
  let readStopsLower: Map<PropertyKey, boolean> | undefined
  // 稳定 Source 沿用已有参与者 memo，延迟读取时也能取得最新截断事实。
  let sourceStopsLower: WeakMap<object, () => boolean> | undefined
  // 账本同时充当本层身份，避免再为身份分配一个对象。
  const owner: object = claims
  let reader = owner
  let consuming = false
  let output: object | undefined
  let peek: Props | undefined
  const accumulation = options.accumulate
  /**
   * 判断字段是否使用拥有者提供的累加规则。
   */
  const accumulates = (key: PropertyKey) => accumulation?.matches(key) ?? false

  /**
   * 在同步读取期间传递认领者；返回 Source 本身，不求值 Source。
   */
  const withReader = <Result>(
    next: object,
    action: () => Result,
    consume = false,
  ): Result => {
    const previous = reader
    const previousConsuming = consuming
    reader = next
    consuming = consume
    try {
      return action()
    } finally {
      reader = previous
      consuming = previousConsuming
    }
  }
  /**
   * 未认领或由当前读取者持有时可用，不改变认领结果。
   */
  const available = (key: PropertyKey, next: object) => {
    const current = claims.get(key)
    return current === undefined || current === next
  }
  /**
   * 惰性 State 延迟读取原来源时，继续使用最初取得字段的读取者身份。
   */
  const fieldReader = (key: PropertyKey) => claims.get(key) ?? reader
  /**
   * 来源和读取适配器由同一 memo 持有；节点身份未变时不重建适配器。
   */
  const createSources = (containers: object = input) =>
    createMemo<DeclarationSource[]>((previous) => {
      const declarations = collectSources(input, containers)
      if (
        previous &&
        previous.length === declarations.length &&
        previous.every((entry, index) => entry.source === declarations[index])
      )
        return previous
      return declarations.map((source) => {
        const upstream = scopes.get(source)
        return upstream
          ? {
              source,
              upstream,
              has: (key) =>
                !isProtocolKey(key) &&
                key !== 'children' &&
                upstream.has(key, fieldReader(key)),
              read: (key) => {
                const next = fieldReader(key)
                if (consuming) upstream.claim(key, next)
                return upstream.read(key, next, consuming)
              },
              readContribution: (key) => {
                const next = fieldReader(key)
                if (consuming) upstream.claim(key, next)
                return upstream.readContribution(key, next, consuming)
              },
            }
          : {
              source,
              has: (key) => key in source,
              read: (key) => Reflect.get(source, key),
            }
      })
    })
  let sources = createSources()
  /**
   * 探测实际来源的字段声明，不认领也不读取字段值。
   */
  const hasRaw = (key: PropertyKey) =>
    key === 'children' || isProtocolKey(key)
      ? key in input
      : sources().some((source) => source.has(key))
  /**
   * 按字段规则取得来源值；是否连带认领上游由当前读取状态决定。
   */
  const readRaw = (key: PropertyKey, direct?: PropSource) => {
    if (key === 'children' || isProtocolKey(key))
      return Reflect.get(input, key)
    const views = sources()
    if (accumulates(key)) {
      const selection = accumulation!.collect(key, views, direct)
      const value = accumulation!.merge(selection.values)
      readStopsLower?.set(key, selection.stopsLower)
      return value
    }
    if (direct?.has(key)) return direct.read(key)
    return views.find((source) => source.has(key))?.read(key)
  }
  /**
   * 为 Kit 的样式归一等内部接线提供声明形状，不读取字段值。
   */
  const keys = () => [
    ...new Set(
      sources().flatMap(({ source, upstream }) => {
        return upstream
          ? upstream
              .keys()
              .filter((key) => !isProtocolKey(key) && key !== 'children')
          : Reflect.ownKeys(source)
      }),
    ),
  ]
  const scope: DeclarationScope = {
    /**
     * 当前输入来源决定外部归属，本层输出包装不改变这份声明事实。
     */
    hasInput: (key) => withReader(owner, () => hasRaw(key)),
    /**
     * 正常交接只向未失去消费权的读取者报告字段存在。
     */
    has: (key, next) =>
      available(key, next) &&
      withReader(next, () => (output ? key in output : hasRaw(key))),
    /**
     * 首个读取者认领字段；同一读取者重复访问不再遍历认领链。
     */
    claim(key, next) {
      const current = claims.get(key)
      if (current !== undefined) return current === next
      // 认领只快照当前声明是否可用，不将占有关系变成字段值的响应依赖。
      if (!untrack(() => scope.has(key, next))) return false
      claims.set(key, next)
      // Director 可能只交付惰性 State；先认领所选来源，不能等以后 val 时才决定消费权。
      if (!accumulates(key)) {
        const upstream = withReader(next, () =>
          untrack(() => sources().find(({ has }) => has(key))?.upstream),
        )
        if (upstream && !isProtocolKey(key)) upstream.claim(key, next)
      }
      return true
    },
    /**
     * 内部探测保持非消费状态，跨层转交不将它升级为认领。
     */
    read: (key, next, consume) =>
      available(key, next)
        ? withReader(
            next,
            () => (output ? Reflect.get(output, key) : readRaw(key)),
            consume,
          )
        : undefined,
    /**
     * 保留最终视图的读取模式和转换，只把原声明的截断事实一起交给下层。
     */
    readContribution(key, next, consume) {
      ;(readStopsLower ??= new Map()).delete(key)
      const value = scope.read(key, next, consume)
      const sourceStop =
        typeof value === 'object' && value !== null
          ? sourceStopsLower?.get(value)
          : undefined
      return {
        value,
        stopsLower: sourceStop
          ? sourceStop()
          : (readStopsLower.get(key) ?? value === undefined),
      }
    },
    /**
     * 交接归一后的声明形状，包含内部建立的配置字段。
     */
    keys: () => (output ? Reflect.ownKeys(output) : keys()),
  }
  /**
   * 为核心包装按读认领的输出；不改变 shadowProps/is 的来源。
   */
  function consume(): Props
  function consume<View extends object>(view: View): View
  function consume(view?: object): object {
    output = view
    if (view && !Object.is(view, peek)) {
      sources = createSources(view)
    }
    const result = new Proxy(
      {},
      {
        get: (_, key) => {
          scope.claim(key, owner)
          return scope.read(key, owner, true)
        },
        has: (_, key) => scope.has(key, owner),
        ownKeys: () => scope.keys() as (string | symbol)[],
        getOwnPropertyDescriptor: (_, key) =>
          scope.has(key, owner)
            ? { enumerable: true, configurable: true }
            : undefined,
      },
    )
    scopes.set(result, scope)
    return result
  }
  function read<Key extends keyof Props>(
    key: Key,
    direct?: PropSource,
  ): Props[Key]
  function read(key: PropertyKey, direct?: PropSource): unknown
  /** 延迟读取恢复字段身份，未认领的内部探测不升级为消费。 */
  function read(key: PropertyKey, direct?: PropSource): unknown {
    return withReader(
      fieldReader(key),
      () => readRaw(key, direct),
      claims.has(key),
    )
  }
  /**
   * 为匹配累加策略的字段建立惰性来源；已有消费身份继续认领参与者，内部借读不升级为消费。
   */
  function createAccumulatedSource(
    key: PropertyKey,
    direct?: PropSource,
  ): StateView<unknown> {
    const participating = createMemo(() =>
      withReader(
        fieldReader(key),
        () => accumulation!.collect(key, sources(), direct),
        claims.has(key),
      ),
    )
    const source = createState(
      () => accumulation!.merge(participating().values),
      {
        lazy: true,
      },
    )
    sourceStopsLower ??= new WeakMap()
    sourceStopsLower.set(source, () => participating().stopsLower)
    return source
  }
  return {
    input,
    accumulates,
    createAccumulatedSource,
    /**
     * Kit 需要归一或控制输入时才建立非消费视图，直接 Piv 不分配这层 Proxy。
     */
    get peek() {
      return (peek ??= new Proxy({} as Props, {
        get: (_, key) => readRaw(key),
        has: (_, key) => hasRaw(key),
        ownKeys: () => keys() as (string | symbol)[],
        getOwnPropertyDescriptor: (_, key) =>
          hasRaw(key)
            ? {
                enumerable: true,
                configurable: true,
                get: () => readRaw(key),
              }
            : undefined,
      }))
    },
    consume,
    read,
    claim: (key: PropertyKey) => scope.claim(key, owner),
  }
}

/**
 * 保留原优先级顺序，已经处理的上层视图作为完整交接单元，不重复展开其 is。
 */
function collectSources(
  input: object,
  containers: object = input,
): object[] {
  const result: object[] = []
  const queue: object[] = [input]
  while (queue.length) {
    const source = queue.pop()!
    result.push(source)
    if (scopes.has(source)) continue
    const props = (
      source === input ? containers : source
    ) as PropsDeclarationInput
    if ('shadowProps' in props) {
      const shadow = props.shadowProps
      if (Array.isArray(shadow)) queue.push(...shadow)
      else if (shadow) queue.push(shadow)
    }
    if ('is' in props) queue.push(...collectPluginDeclarations(props.is))
  }
  return result
}
