/**
 * 受控组件实例的输入视图与干预入口。
 *
 * 按完整字段协议连接上游和缺省来源，为核心提供读取视图并公开共用的可写状态。
 *
 * 让输入干预沿用组件原有消费方式，状态归属实例且不重放创建动作。
 */
import { createState, val, type State, type Val } from '@/foundation'
import { getOwner, runWithOwner, untrack } from '@/foundation/reactivity'
import { mapGet } from '@edsolater/fnkit'

/**
 * 启用 Props 控制时，规定字段的控制入口与核心读取方式。
 *
 * 三种 state 模式都建立可写 State，并通过 Controller.props 公开；
 * 区别在于组件核心取得 State 本身，还是以何种跟踪方式读取当前值。
 * only-through-prop 原样转交上游声明，不建立 State 或控制入口。
 */
export type PropsReadMode =
  /**
   * 核心取得与 Controller 共用的 State，作为 Source 交给实际消费者。
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
      ? State<Val<Props[Key]>>
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
  Props,
  Definition extends PropsDefinition<Props>,
> = {
  /** 创建时为未声明字段建立默认来源；Source 的值仍按需读取，普通返回值不是持续计算。 */
  defaultSources?: DefaultPropSources<Props, Definition>
  omit?: readonly (keyof Props)[]
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
  const states = new Map<PropertyKey, State<unknown>>()
  /**
   * 取得本字段共用的可写状态，首次访问时连接上游或默认来源。
   */
  const getState = (key: PropertyKey) =>
    mapGet(states, key, () =>
      runWithOwner(owner, () => {
        const declared = key in rawProps
        const fallback =
          !declared && defaultSources && Object.hasOwn(defaultSources, key)
            ? Reflect.get(defaultSources, key)?.(inputProps)
            : undefined
        return createState(
          () => val(declared ? Reflect.get(rawProps, key) : fallback),
          { lazy: true },
        )
      }),
    )
  /**
   * 按字段协议读取当前输入；未声明读取规则的字段直接交回上游值。
   */
  const read = (key: PropertyKey) => {
    if (!Object.hasOwn(definition, key)) return Reflect.get(rawProps, key)
    const mode = Reflect.get(definition, key) as PropsReadMode
    if (mode === 'only-through-prop') return Reflect.get(rawProps, key)
    if (mode === 'state-source-view') return getState(key)
    if (mode === 'state-untracked') return untrack(() => val(getState(key)))
    return val(getState(key))
  }
  /**
   * 创建保留动态读取的核心视图，反映默认字段并排除本视图不消费的字段。
   */
  const view = (
    defaults?: DefaultPropSources<Props, Definition>,
    omit: readonly (keyof Props)[] = [],
  ) => {
    /**
     * 判断当前视图是否包含字段，包含原声明及可见默认来源。
     */
    const has = (key: PropertyKey) =>
      !omit.includes(key as keyof Props) &&
      (key in rawProps || Boolean(defaults && Object.hasOwn(defaults, key)))
    return new Proxy(
      {},
      {
        get: (_, key) =>
          omit.includes(key as keyof Props) ? undefined : read(key),
        has: (_, key) => has(key),
        ownKeys: () =>
          [
            ...new Set([
              ...Reflect.ownKeys(rawProps),
              ...(defaults
                ? Reflect.ownKeys(defaults).filter((key) => !(key in rawProps))
                : []),
            ]),
          ].filter(has),
        getOwnPropertyDescriptor: (_, key) => {
          if (omit.includes(key as keyof Props)) return
          const descriptor =
            Object.getOwnPropertyDescriptor(rawProps, key) ??
            (!(key in rawProps) && defaults
              ? Object.getOwnPropertyDescriptor(defaults, key)
              : undefined)
          if (!descriptor) return
          return {
            enumerable: descriptor.enumerable,
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
    // 默认来源属于 Props 的构建；只建立 Source，不读取其值或感知来源内部的业务规则。
    if (
      !(key in rawProps) &&
      defaultSources &&
      Object.hasOwn(defaultSources, key)
    )
      getState(key)
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
  return { props: view(defaultSources, options?.omit), controller }
}
