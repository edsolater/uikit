/**
 * 组件字段的读取约定，以及按约定建立的 Props 控制入口。
 *
 * 为组件提供字段读取视图，为 Controller 提供允许修改的字段 State。
 *
 * 对实例输入的修改不回写调用者，也不需要重建组件。
 */
import {
  createState,
  val,
  type State,
  type StateView,
  type Val,
} from '@/foundation'
import { getOwner, runWithOwner, untrack } from '@/foundation/reactivity'
import { cacheFn, mapGet } from '@edsolater/fnkit'
import { readStateSource } from '@/foundation/createState/state-source'
import type {
  PropsDeclaration,
  PropSource,
} from './propsDeclaration/shadowProps'

/**
 * 一个字段交给组件的形式，以及 Controller 能否修改它。
 * 三种可控模式提供 State 写入入口；only-through-prop 仅转交原声明。
 */
export type PropDefinition =
  /**
   * 核心取得稳定的 StateView，作为 Source 交给实际消费者。
   * 消费者负责读取当前值，并在自己的消费作用域建立响应依赖。
   */
  | 'source'

  /**
   * 核心读取普通字段的 State 当前值；累加字段取得补充声明合并后的当前值。
   * 本次读取参与当前作用域的响应依赖收集。
   */
  | 'tracked-value'

  /**
   * 核心读取普通字段的 State 当前值；累加字段取得补充声明合并后的当前值。
   * 本次读取不收集响应依赖。
   * 不固定初值；之后再次读取，仍取得当时的当前值。
   */
  | 'untracked-value'

  /**
   * 核心直接读取上游 Props，原样取得声明，不解包 Source，也不缓存读取结果。
   * 不建立 State，不在 Controller.props 中公开该字段。
   */
  | 'only-through-prop'

/** 组件的完整字段定义表，包含可选字段。每项定义组件读到什么，以及 Controller 能否写入。 */
export type PropsDefinition<Props> = { [Key in keyof Props]-?: PropDefinition }

/** 按字段协议公开可写 State；only-through-prop 字段不进入控制入口。 */
export type WritablePropStates<
  Props,
  Definition extends PropsDefinition<Props>,
> = {
  [
    Key in keyof Props as Definition[Key] extends 'only-through-prop'
      ? never
      : Key
  ]-?: State<Val<Props[Key]>>
}

/** 核心实际取得的输入视图，字段按各自协议保留来源或读取当前值。 */
export type ControlledProps<
  Props,
  Definition extends PropsDefinition<Props>,
> = {
  [Key in keyof Props]: Definition[Key] extends 'only-through-prop'
    ? Props[Key]
    : Definition[Key] extends 'source'
      ? StateView<Val<Props[Key]>>
      : Val<Props[Key]>
}

/** 可控字段的缺省来源工厂，可从传入视图读取其它字段来计算默认来源。 */
export type DefaultPropSources<
  Props,
  Definition extends PropsDefinition<Props>,
> = {
  [
    Key in keyof Props as Definition[Key] extends 'only-through-prop'
      ? never
      : Key
  ]?: (input: ControlledProps<Props, Definition>) => Props[Key]
}

/** 定义端提供缺省来源与输出字段选择，沿用同一字段协议。 */
export type PropsControllerOptions<
  Props extends object,
  Definition extends PropsDefinition<Props>,
> = {
  /**
   * 只有当前未声明字段时才使用；显式 undefined 也算声明。
   * 首次需要时构建一次，之后读取同一来源；持续计算须返回 Source。
   */
  defaultSources?: DefaultPropSources<Props, Definition>
  /**
   * 沿用直接 Props、shadowProps 和 Plugin 的合并规则。
   * 累加字段只改本层直接声明：class 为 A、补充为 B 时，写 C 得到 B 与 C。
   */
  declaration?: Pick<
    PropsDeclaration<Props>,
    'directProps' | 'accumulates' | 'read' | 'createAccumulatedSource'
  >
  /** 按当前查询决定组件 props 是否显示字段；不取消该字段在 states 中的写入入口。 */
  omit?: (key: keyof Props) => boolean
}

/**
 * 接收已归一的 Props 与完整字段定义，为当前实例建立读取和修改入口。
 * 缺省来源与字段隐藏由 options 决定；写入不回写上游，上游来源变化后仍重新跟随来源。
 * 传入 declaration 时沿用补充声明的合并，累加字段的写入只替换直接值。
 *
 * props 交给组件，states 提供允许修改的字段 State；readProp 供结构查看读取，不开始本层字段使用。
 * 在组件或 createRoot 的作用域内创建，状态随该作用域清理。
 *
 * @example
 * import { createRoot, flush } from '@/foundation'
 * const { props, states, dispose } = createRoot((dispose) => ({
 *   ...createPropsController({ disabled: false }, { disabled: 'tracked-value' }),
 *   dispose,
 * }))
 * states.disabled.set(true) // 在创建作用域外发出指令。
 * flush()
 * props.disabled // true
 * dispose()
 */
export function createPropsController<
  Props extends object,
  const Definition extends PropsDefinition<Props>,
>(
  normalizedProps: Props,
  definition: Definition,
  options?: PropsControllerOptions<Props, Definition>,
) {
  // 保存实例归属；字段 State 与 StateView 按需建立。
  const owner = getOwner()
  const defaultSources = options?.defaultSources
  const declaration = options?.declaration
  const fields = new Map<
    PropertyKey,
    { state?: State<unknown>; view?: StateView<unknown> }
  >()
  // 记录显式写入的字段，让没有上游声明的字段也能显示；普通查询不计入。
  const writtenKeys = createState<(string | symbol)[]>([])
  /**
   * 取得该字段的共享记录，不因此读取上游或创建可写 State。
   */
  const getField = (key: string | symbol) => mapGet(fields, key, () => ({}))
  /**
   * 取得本实例该字段的 State，首次需要时连接上游或缺省来源。
   * 累加字段只控制直接声明，补充来源仍由声明工具合并。
   */
  const getState = (key: string | symbol) => {
    const field = getField(key)
    return (field.state ??= runWithOwner(owner, () => {
      const source = declaration?.accumulates(key)
        ? declaration.directProps
        : normalizedProps
      /**
       * 首次需要时取得缺省来源，后续复用该来源而非它的当前值。
       */
      const fallback = cacheFn(() =>
        runWithOwner(owner, () =>
          defaultSources && Object.hasOwn(defaultSources, key)
            ? Reflect.get(defaultSources, key)?.(propsForDefaults)
            : undefined,
        ),
      )
      const state: State<unknown> = createState<unknown>(
        () => (key in source ? Reflect.get(source, key) : fallback()),
        { lazy: true },
      )
      const set = state.set
      /**
       * 接受字段修改，并让原本缺失的字段进入当前视图。
       */
      state.set = value => {
        const result = set(value)
        writtenKeys.set(keys => (keys.includes(key) ? keys : [...keys, key]))
        return result
      }
      return state
    }))
  }
  // 合并时仅替换 Controller 已写入的直接声明，保留来源实体的含义。
  const writtenDirectProps: PropSource = {
    /**
     * 只报告已经显式写入的字段。
     */
    has: key => val(writtenKeys).includes(key as string | symbol),
    /**
     * 取得原始来源，供合并区分 literal undefined 与 Source 的当前空值。
     */
    read: key => readStateSource(getState(key as string | symbol)),
  }
  /**
   * 读取可控字段的完成值，only-through-prop 字段保留原声明。
   * 例如结构查看先读 label，不会因此使下层失去该字段，也不预建核心的 StateView。
   */
  function readProp<Key extends keyof Props>(
    key: Key,
  ): Definition[Key] extends 'only-through-prop' ? Props[Key] : Val<Props[Key]>
  function readProp(key: PropertyKey): unknown
  function readProp(key: PropertyKey): unknown {
    if (
      !Object.hasOwn(definition, key) ||
      Reflect.get(definition, key) === 'only-through-prop'
    ) {
      return Reflect.get(normalizedProps, key)
    }
    return declaration?.accumulates(key)
      ? declaration.read(key, writtenDirectProps)
      : val(getState(key as string | symbol))
  }
  /**
   * 按字段协议读取当前输入；未声明读取规则的字段直接交回上游值。
   */
  const read = (key: string | symbol) => {
    if (!Object.hasOwn(definition, key))
      return Reflect.get(normalizedProps, key)
    const mode = Reflect.get(definition, key) as PropDefinition
    if (mode === 'only-through-prop') return Reflect.get(normalizedProps, key)
    if (mode === 'source') {
      const field = getField(key)
      return (field.view ??= runWithOwner(owner, () =>
        declaration?.accumulates(key)
          ? declaration.createAccumulatedSource(key, writtenDirectProps)
          : getState(key),
      ))
    }
    return mode === 'untracked-value'
      ? untrack(() => readProp(key))
      : readProp(key)
  }
  /**
   * 创建动态字段视图，按参数加入缺省字段并隐藏指定字段。
   * 字段的值仍由读取约定决定，隐藏不改变 states 的控制能力。
   */
  const view = (
    defaults?: DefaultPropSources<Props, Definition>,
    projection?: PropsControllerOptions<Props, Definition>,
  ) => {
    /**
     * 判断字段在此视图是否可见，包括原声明、显式写入及缺省来源。
     */
    const has = (key: string | symbol) =>
      !projection?.omit?.(key as keyof Props) &&
      (key in normalizedProps ||
        (Object.hasOwn(definition, key) && val(writtenKeys).includes(key)) ||
        Boolean(defaults && Object.hasOwn(defaults, key)))
    return new Proxy(
      {},
      {
        get: (_, key) =>
          projection?.omit?.(key as keyof Props) ? undefined : read(key),
        has: (_, key) => has(key),
        ownKeys: () =>
          [
            ...new Set([
              ...Reflect.ownKeys(normalizedProps),
              ...val(writtenKeys),
              ...(defaults
                ? Reflect.ownKeys(defaults).filter(
                    key => !(key in normalizedProps),
                  )
                : []),
            ]),
          ].filter(has),
        getOwnPropertyDescriptor: (_, key) => {
          if (projection?.omit?.(key as keyof Props)) return
          const descriptor =
            Object.getOwnPropertyDescriptor(normalizedProps, key) ??
            (!(key in normalizedProps) && defaults
              ? Object.getOwnPropertyDescriptor(defaults, key)
              : undefined)
          if (!descriptor && !val(writtenKeys).includes(key)) return
          return {
            enumerable: descriptor?.enumerable ?? true,
            configurable: true,
            get: () => read(key),
          }
        },
      },
    ) as ControlledProps<Props, Definition>
  }
  // 缺省工厂可读取完整输入；对组件的字段隐藏只应用于最终 props。
  const propsForDefaults = view()
  const states = {} as WritablePropStates<Props, Definition>
  // 只为允许控制的字段提供入口，实际访问时才取得 State。
  for (const key of Reflect.ownKeys(definition)) {
    if (Reflect.get(definition, key) === 'only-through-prop') continue
    Object.defineProperty(states, key, {
      enumerable: true,
      get() {
        const state = getState(key)
        // 原生惰性计算先取得初值，再接受首次指令；不求值其它字段。
        untrack(state)
        return state
      },
    })
  }
  return {
    props: view(defaultSources, options),
    states,
    readProp,
  }
}
