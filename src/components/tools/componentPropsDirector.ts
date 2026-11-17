/**
 * 受控组件实例的输入视图与干预入口。
 *
 * 按完整字段协议连接上游和缺省来源，为核心提供读取视图，为 Controller 提供可写状态。
 *
 * 让输入干预沿用组件原有消费方式，状态归属实例且不重放创建动作。
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
 * 启用 Props 控制时，规定字段的控制入口与核心读取方式。
 *
 * 三种 state 模式都允许 Controller.props 按需取得可写 State；
 * 核心按协议取得来源视图或当前值；提供声明解析器时，节点累加仍遵守其字段策略。
 * only-through-prop 原样转交上游声明，不建立 State 或控制入口。
 */
export type PropsReadMode =
  /**
   * 核心取得稳定的只读来源视图，作为 Source 交给实际消费者。
   * 消费者负责读取当前值，并在自己的消费作用域建立响应依赖。
   */
  | 'state-source-view'

  /**
   * 核心读取字段时，取得 State 的当前值。
   * 本次读取参与当前作用域的响应依赖收集。
   */
  | 'state-value-view'

  /**
   * 核心读取字段时，取得 State 的当前值，但不收集本次读取的响应依赖。
   * 不固定初值；之后再次读取，仍取得当时的当前值。
   */
  | 'state-untracked'

  /**
   * 核心直接读取上游 Props，原样取得声明，不解包 Source，也不缓存读取结果。
   * 不建立 State，不在 Controller.props 中公开该字段。
   */
  | 'only-through-prop'

/** 每个输入字段的完整读取协议，不允许遗漏可选字段。 */
export type PropsDefinition<Props> = { [Key in keyof Props]-?: PropsReadMode }

/** 按字段协议公开可写 State；只从上游传入的字段不进入控制入口。 */
export type PropsController<
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
export type DirectedProps<Props, Definition extends PropsDefinition<Props>> = {
  [Key in keyof Props]: Definition[Key] extends 'only-through-prop'
    ? Props[Key]
    : Definition[Key] extends 'state-source-view'
      ? StateView<Val<Props[Key]>>
      : Val<Props[Key]>
}
/** 为未声明的可控字段提供初始来源，读取时可依赖同一输入视图。 */
export type DefaultPropSources<
  Props,
  Definition extends PropsDefinition<Props>,
> = {
  [
    Key in keyof Props as Definition[Key] extends 'only-through-prop'
      ? never
      : Key
  ]?: (input: DirectedProps<Props, Definition>) => Props[Key]
}

/** 定义端提供缺省来源与输出字段选择，沿用同一字段协议。 */
export type PropsDirectorOptions<
  Props extends object,
  Definition extends PropsDefinition<Props>,
> = {
  /** 首次需要缺省来源时构建一次；后续持续读取该 Source，普通返回值不是持续计算。 */
  defaultSources?: DefaultPropSources<Props, Definition>
  /** 接管已有声明的输入控制；累加字段仅改直接贡献，核心读取完整合并结果。 */
  declaration?: Pick<
    PropsDeclaration<Props>,
    'input' | 'accumulates' | 'read' | 'createAccumulatedSource'
  >
  /** 按当前查询字段决定输出可见性，保持动态来源选择且不展开无关字段。 */
  omit?: (key: keyof Props) => boolean
}

/**
 * 根据完整字段协议建立共享输入视图与可写控制入口，不改写上游对象。
 * 未声明字段可接入定义端默认来源；omit 只影响核心看到的字段，不删除对应控制能力。
 * 状态在本实例作用域按需建立，输入更新不重放组件创建动作。
 */
export function createComponentPropsDirector<
  Props extends object,
  const Definition extends PropsDefinition<Props>,
>(
  rawProps: Props,
  definition: Definition,
  options?: PropsDirectorOptions<Props, Definition>,
) {
  const owner = getOwner()
  const defaultSources = options?.defaultSources
  const declaration = options?.declaration
  const fields = new Map<
    PropertyKey,
    { state?: State<unknown>; view?: StateView<unknown> }
  >()
  // 只有显式写入才扩展声明形状；普通读取与结构查看不会暗中启用节点能力。
  const writtenKeys = createState<(string | symbol)[]>([])
  /**
   * 共用字段记录不预建可写状态；纯只读累加来源无需支付直接State的成本。
   */
  const getField = (key: string | symbol) => mapGet(fields, key, () => ({}))
  /**
   * 直接输入真正需要读写时才建立 State，归属原实例作用域。
   */
  const getState = (key: string | symbol) => {
    const field = getField(key)
    return (field.state ??= runWithOwner(owner, () => {
      const source = declaration?.accumulates(key)
        ? declaration.input
        : rawProps
      // 缺省工厂只在真正缺省时构建一次，保留它交付的 Source，不缓存其值。
      const fallback = cacheFn(() =>
        runWithOwner(owner, () =>
          defaultSources && Object.hasOwn(defaultSources, key)
            ? Reflect.get(defaultSources, key)?.(inputProps)
            : undefined,
        ),
      )
      const state: State<unknown> = createState<unknown>(
        () => (key in source ? Reflect.get(source, key) : fallback()),
        { lazy: true },
      )
      const set = state.set
      state.set = (value) => {
        const result = set(value)
        writtenKeys.set((keys) => (keys.includes(key) ? keys : [...keys, key]))
        return result
      }
      return state
    }))
  }
  // 同一直接贡献同时服务核心与内部借读；不经过 Controller 的初始化读取。
  const direct: PropSource = {
    has: (key) => val(writtenKeys).includes(key as string | symbol),
    read: (key) => readStateSource(getState(key as string | symbol)),
  }
  /**
   * 借读可控字段的完成值，only-through 字段保留原声明；不建立当前字段的新认领或预建核心来源。
   */
  function peek<Key extends keyof Props>(
    key: Key,
  ): Definition[Key] extends 'only-through-prop' ? Props[Key] : Val<Props[Key]>
  function peek(key: PropertyKey): unknown
  function peek(key: PropertyKey): unknown {
    if (
      !Object.hasOwn(definition, key) ||
      Reflect.get(definition, key) === 'only-through-prop'
    ) {
      return Reflect.get(rawProps, key)
    }
    return declaration?.accumulates(key)
      ? declaration.read(key, direct)
      : val(getState(key as string | symbol))
  }
  /**
   * 按字段协议读取当前输入；未声明读取规则的字段直接交回上游值。
   */
  const read = (key: string | symbol) => {
    if (!Object.hasOwn(definition, key)) return Reflect.get(rawProps, key)
    const mode = Reflect.get(definition, key) as PropsReadMode
    if (mode === 'only-through-prop') return Reflect.get(rawProps, key)
    if (mode === 'state-source-view') {
      const field = getField(key)
      return (field.view ??= runWithOwner(owner, () =>
        declaration?.accumulates(key)
          ? declaration.createAccumulatedSource(key, direct)
          : getState(key),
      ))
    }
    return mode === 'state-untracked' ? untrack(() => peek(key)) : peek(key)
  }
  /**
   * 创建保留动态读取的核心视图，反映默认字段并排除本视图不消费的字段。
   */
  const view = (
    defaults?: DefaultPropSources<Props, Definition>,
    projection?: PropsDirectorOptions<Props, Definition>,
  ) => {
    /**
     * 判断当前视图是否包含字段，包含原声明及可见默认来源。
     */
    const has = (key: string | symbol) =>
      !projection?.omit?.(key as keyof Props) &&
      (key in rawProps ||
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
              ...Reflect.ownKeys(rawProps),
              ...val(writtenKeys),
              ...(defaults
                ? Reflect.ownKeys(defaults).filter((key) => !(key in rawProps))
                : []),
            ]),
          ].filter(has),
        getOwnPropertyDescriptor: (_, key) => {
          if (projection?.omit?.(key as keyof Props)) return
          const descriptor =
            Object.getOwnPropertyDescriptor(rawProps, key) ??
            (!(key in rawProps) && defaults
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
    ) as DirectedProps<Props, Definition>
  }
  const inputProps = view()
  const controller = {} as PropsController<Props, Definition>
  for (const key of Reflect.ownKeys(definition)) {
    if (Reflect.get(definition, key) === 'only-through-prop') continue
    Object.defineProperty(controller, key, {
      enumerable: true,
      get() {
        const state = getState(key)
        // 原生惰性计算先取得初值，再接受首次指令；不求值其它字段。
        untrack(() => val(state))
        return state
      },
    })
  }
  return {
    props: view(defaultSources, options),
    controller,
    peek,
  }
}
