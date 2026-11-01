/**
 * 为主动接入控制器的组件准备可写 Props；字段读取方式由组件的运行时定义指定。
 * 输入保留原声明形状，输出补充默认来源并投影字段，可干预字段的入口共用按需建立的 State，仅通过 Prop 的字段原样转交。
 */
import { createState, val, type State, type Val } from '@/foundation'
import { getOwner, runWithOwner, untrack } from '@/foundation/reactivity'
import { mapGet } from '@edsolater/fnkit'

export type PropsReadMode = 'state-source-view' | 'state-value-view' | 'state-untracked' | 'only-through-prop'
export type PropsDefinition<Props> = { [Key in keyof Props]-?: PropsReadMode }
export type PropsController<Props, Definition extends PropsDefinition<Props>> = {
  [Key in keyof Props as Definition[Key] extends 'only-through-prop' ? never : Key]-?: State<Val<Props[Key]>>
}
export type DirectedProps<Props, Definition extends PropsDefinition<Props>> = {
  [Key in keyof Props]: Definition[Key] extends 'only-through-prop'
    ? Props[Key]
    : Definition[Key] extends 'state-source-view'
    ? State<Val<Props[Key]>>
    : Val<Props[Key]>
}
export type DefaultPropSources<Props, Definition extends PropsDefinition<Props>> = {
  [Key in keyof Props as Definition[Key] extends 'only-through-prop' ? never : Key]?: (input: DirectedProps<Props, Definition>) => Props[Key]
}

/** 定义端提供缺省来源与输出字段选择，沿用同一字段协议。 */
export type PropsDirectorOptions<Props, Definition extends PropsDefinition<Props>> = {
  /** 创建时为未声明字段建立默认来源；Source 的值仍按需读取，普通返回值不是持续计算。 */
  defaultSources?: DefaultPropSources<Props, Definition>
  omit?: readonly (keyof Props)[]
}

/** 只改变输出 Props 的来源和形状，不改写上游对象，也不重放组件的创建动作。 */
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
  const getState = (key: PropertyKey) => mapGet(states, key, () => runWithOwner(owner, () => {
    const declared = key in rawProps
    const fallback = !declared && defaultSources && Object.hasOwn(defaultSources, key)
      ? Reflect.get(defaultSources, key)?.(inputProps) : undefined
    return createState(() => val(declared ? Reflect.get(rawProps, key) : fallback), { lazy: true })
  }))
  const read = (key: PropertyKey) => {
    if (!Object.hasOwn(definition, key)) return Reflect.get(rawProps, key)
    const mode = Reflect.get(definition, key) as PropsReadMode
    if (mode === 'only-through-prop') return Reflect.get(rawProps, key)
    if (mode === 'state-source-view') return getState(key)
    if (mode === 'state-untracked') return untrack(() => val(getState(key)))
    return val(getState(key))
  }
  const view = (
    defaults?: DefaultPropSources<Props, Definition>,
    omit: readonly (keyof Props)[] = [],
  ) => {
    const has = (key: PropertyKey) =>
      !omit.includes(key as keyof Props)
      && (key in rawProps || Boolean(defaults && Object.hasOwn(defaults, key)))
    return new Proxy({}, {
      get: (_, key) => omit.includes(key as keyof Props) ? undefined : read(key),
      has: (_, key) => has(key),
      ownKeys: () => [...new Set([
        ...Reflect.ownKeys(rawProps),
        ...defaults ? Reflect.ownKeys(defaults).filter(key => !(key in rawProps)) : [],
      ])].filter(has),
      getOwnPropertyDescriptor: (_, key) => {
        if (omit.includes(key as keyof Props)) return
        const descriptor = Object.getOwnPropertyDescriptor(rawProps, key)
          ?? (!(key in rawProps) && defaults ? Object.getOwnPropertyDescriptor(defaults, key) : undefined)
        if (!descriptor) return
        return {
          enumerable: descriptor.enumerable,
          configurable: true,
          get: () => read(key),
        }
      },
    }) as DirectedProps<Props, Definition>
  }
  const inputProps = view()
  const controller = {} as PropsController<Props, Definition>
  for (const key of Reflect.ownKeys(definition)) {
    if (Reflect.get(definition, key) === 'only-through-prop') continue
    // 默认来源属于 Props 的构建；只建立 Source，不读取其值或感知来源内部的业务规则。
    if (!(key in rawProps) && defaultSources && Object.hasOwn(defaultSources, key)) getState(key)
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
