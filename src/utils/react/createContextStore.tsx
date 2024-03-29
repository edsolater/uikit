import { assert, map, pick, shrinkToValue, toPascalCase } from '@edsolater/fnkit'
import { toCamelCase } from '@edsolater/fnkit'
import React, { createContext, ReactElement, ReactNode, useContext, useEffect, useMemo, useState } from 'react'

type MayStateFn<T> = T | ((prev: T) => T)
type StoreTemplate = { [key: string]: any }

type Setters<S extends StoreTemplate> = {
  /**
   *  will be merged to the store
   */
  set<P extends keyof S>(propName: P, value: MayStateFn<S[P]>): void
  set(newState: MayStateFn<Partial<S>>): void
  reset(propName: keyof S): void

  /**
   * will cover to store
   */
  setAll(newStore: MayStateFn<S>): void
  /**
   * set store to it's default value
   */
  resetAll(): void
} & {
  [K in `set${Capitalize<Extract<keyof S, string>>}`]: (
    newState: MayStateFn<K extends `set${infer O}` ? S[Uncapitalize<O>] : any>
  ) => void
} & {
  [K in `reset${Capitalize<Extract<keyof S, string>>}`]: () => void
}

export type GetUseDataHooks<T extends StoreTemplate> = () => T & Setters<T>

/**
 * compute setState methods
 * @param initStates only state, no setState
 * @param setAll set parent's store
 * @returns computed setState methods
 */
const getSetters = <S extends StoreTemplate>(
  initStates: Partial<S>,
  setAll: React.Dispatch<React.SetStateAction<S>>
): Setters<S> => {
  const cache = new Map() // to avoid rerender by always returned new setState function

  const baseSetters = {
    set(p: any, v?: any) {
      if (typeof p === 'string') {
        setAll((oldStore) => {
          const oldV = oldStore[p]
          const newV = shrinkToValue(v, [oldV])
          return oldV === newV ? oldStore : { ...oldStore, [p]: newV }
        })
      } else if (typeof p === 'object') {
        setAll((oldStore) => {
          const newStore = shrinkToValue(p, [oldStore])
          return oldStore === newStore ? oldStore : { ...oldStore, ...newStore }
        })
      }
    },
    reset(p: keyof S) {
      setAll((oldStore) => {
        const oldV = oldStore[p]
        const newV = initStates[p]
        return oldV === newV ? oldStore : { ...oldStore, [p]: newV }
      })
    },

    setAll(inputStore: any) {
      setAll((oldStore) => ({ ...shrinkToValue(inputStore, [oldStore]) }))
    },
    resetAll() {
      setAll(initStates as S)
    }
  }
  // @ts-expect-error force
  return new Proxy(baseSetters, {
    get(target, p: string) {
      if (typeof p !== 'string') return // react devtool may pass this a symbol
      if (p in target) return (target as any)[p]
      if (p.startsWith('set')) {
        if (cache.has(p)) return cache.get(p)
        else {
          const setState = (dispatchNewState: any) => {
            const realPropertyName = toCamelCase(p.replace(/^set/, ''))
            baseSetters.set(realPropertyName, dispatchNewState)
          }
          cache.set(p, setState)
          return setState
        }
      }
      if (p.startsWith('reset')) {
        if (cache.has(p)) return cache.get(p)
        else {
          const resetState = () => {
            const realPropertyName = toCamelCase(p.replace(/^reset/, ''))
            baseSetters.reset(realPropertyName)
          }
          cache.set(p, resetState)
          return resetState
        }
      }
    }
  })
}

/**
 * Creact a store.
 * without  useContext.
 *
 * @example
 *
 * * // in global
 * const {
 *   ContextProvider,
 *   useStore, // subscribe whole store, this may cause rerender issuse
 *   useStoreSetters, // only subscribe all setters, and all setters won't cause rerender
 *   useFoo, // will not rerender if `foo` doesn't change
 * } = createContextStore(
 *   {
 *     foo: 1,
 *     bar: 1
 *   },
 *   {
 *     debugName: 'DrawerMethodsContext',
 *     subHooks: { useFoo: ['foo'] }
 *   }
 * )
 * return <ContextProvider>{props.children}</ContextProvider>
 *
 * * // in child component
 * cosnt { foo, setFoo } = useStore()
 *
 * * // or
 * const { setFoo } = useStoreSetters() // never rerender
 *
 * * // or
 * const { foo } = useFoo() // only rerender when `foo` change
 *
 */
function createContextStoreCore<T extends StoreTemplate, SubHookName extends string = string>(
  initStoreObject: T,
  options?: {
    /** easier debug in react devtool */
    debugName?: string
    /** invoke once, useEffect for `<Provider/>` */
    initEffect?(storeInfos: T & Setters<T>): void
    /** create additional hooks to avoid rerender */
    // subHooks?: { [subContextHookName in SubHookName]: (keyof T)[] }
    subHooks?: Record<SubHookName, (keyof T)[]>
  }
): {
  getStoreState(): T

  useStoreValues(): T
  /** clean version of `useStore()`  */
  useStore(): T & Setters<T>
  /** can only access setXXX and resetXXX , use this hooks to avoid useless rerender */
  useStoreSetters(): Setters<T>
  /**
   * It should be add to component tree root(no need any props)
   */
  ContextProvider: (props: { children?: React.ReactNode; initStore?: Partial<T> }) => JSX.Element
} & {
  [subContextHookName in SubHookName]: () => T
} {
  let currentStoreState = initStoreObject
  // hold data
  const StoreContext = createContext<any>({})

  // SettersContext is only subscribe setters of StoreContext, so it can avoid rerender caused by state change
  const SettersContext = createContext<any>({})

  // just subscribe store data
  //TODO: so map's type is not smart enough
  const SubHooksContexts = (options?.subHooks ? map(options.subHooks, () => createContext<any>({})) : {}) as Record<
    SubHookName,
    React.Context<any>
  >

  /**
   *  will auto registed by {@link BossContextProvider `<ContextStoreProvider>`}
   */
  const StoreStateContextProvider = React.memo(
    ({ children, initStore: initStoreProps }: { children?: ReactNode; initStore?: Partial<T> }) => {
      const initStore = { ...initStoreObject, ...initStoreProps } as Partial<T>
      const [store, setEntireStore] = useState<T>(initStore as any)
      currentStoreState = store
      const setters = useMemo(() => getSetters<T>(initStore ?? {}, setEntireStore), [])
      const splitPartContextValue = useMemo(() => ({ store, setters }), [store])
      const merged = Object.assign(setters, store) as T & Setters<T> // can't use object desctruction
      useEffect(() => {
        options?.initEffect?.(merged)
      }, [])
      return React.createElement(StoreContext.Provider, { value: splitPartContextValue }, children)
    }
  )
  StoreStateContextProvider.displayName = `${options?.debugName}(store)`

  /**
   * will auto registed by {@link BossContextProvider `<ContextStoreProvider>`}
   */
  const StoreSettersContextProvider = React.memo(({ children }: { children: any }) => {
    const { setters } = useContext(StoreContext)
    return <SettersContext.Provider value={setters}>{children}</SettersContext.Provider>
  })
  StoreSettersContextProvider.displayName = `_${options?.debugName}(storeSetters)`

  /**
   * will auto registed by {@link BossContextProvider `<ContextStoreProvider>`}
   */
  const SubHooksContextProvider = React.memo(({ children }: { children: any }) =>
    Object.entries(options?.subHooks ?? ({} as { [subContextHookName in SubHookName]: (keyof T)[] })).reduce(
      (acc, entry) => {
        const [subHookName, keys] = entry as unknown as [SubHookName, (keyof T)[]]
        const stateStore = useContext(StoreContext) as T & Setters<T>
        const storePiece = useMemo(() => pick(stateStore.store, keys), Object.values(pick(stateStore.store, keys))) // subHooks core to avoid rerender
        const Provider = SubHooksContexts[subHookName].Provider
        return (
          <Provider key={subHookName} value={storePiece}>
            {acc}
          </Provider>
        )
      },
      (<>{children}</>) as ReactElement
    )
  )
  StoreSettersContextProvider.displayName = `_${options?.debugName}(subStore)`
  /**
   * integrative Registor
   * will regist {@link StoreSettersContextProvider `<StoreSettersProvider>`} and {@link StoreStateContextProvider `<StoreStateProvider>`} in a component
   * StoreState will hold state
   * StoreSetters will is state's setState fn selector(use it to avoid unnecessary rerender)
   */
  const BossContextProvider = React.memo(
    ({ children, ...restProps }: Parameters<typeof StoreStateContextProvider>[0]) => (
      <StoreStateContextProvider {...restProps}>
        <StoreSettersContextProvider>
          <SubHooksContextProvider>{children}</SubHooksContextProvider>
        </StoreSettersContextProvider>
      </StoreStateContextProvider>
    )
  )
  BossContextProvider.displayName = `${options?.debugName}`

  return {
    ...{
      ContextProvider: BossContextProvider,
      useStore() {
        const {
          setters = new Proxy(
            {},
            {
              get(_target, p) {
                throw new Error(`can't access ${String(p)}. Cause StoreContext haven't init yet, you may not see this`)
              }
            }
          ),
          store = new Proxy(
            {},
            {
              get(_target, p) {
                throw new Error(`can't access ${String(p)}. Cause StoreContext haven't init yet, you may not see this`)
              }
            }
          )
        } = useContext(StoreContext)
        return Object.assign(setters, store)
      },
      useStoreValues: () => {
        const { store: storeValues } = useContext(StoreContext)
        return storeValues
      },
      useStoreSetters: () => useContext(SettersContext),
      getStoreState: () => currentStoreState
    },
    ...map(
      options?.subHooks ?? {},
      (value, subHookName) => () => useContext(SubHooksContexts[subHookName as SubHookName])
    )
  } as any
}

/**
 * IMPORTANT: all store data must exist in initStoreObject
 */
export const createContextStore = <T extends StoreTemplate>(
  initStoreObject: T,
  options?: {
    /** easier debug in react devtool */
    debugName?: string
    /** invoke once, useEffect for `<Provider/>` */
    initEffect?(storeInfos: T & Setters<T>): void
  }
): {
  /**
   * It should be add to component tree root(no need any props)
   */
  ContextProvider: (props: { children?: React.ReactNode }) => JSX.Element

  getStoreState(): T

  useStore<N extends Extract<keyof T, string>>(
    stateName: N
  ): { [subName in N]: T[N] } & {
    [SubSetState in `set${Capitalize<N>}` | `reset${Capitalize<N>}`]: Setters<T>[SubSetState]
  }
  useStore(): T & Setters<T>

  /** can only access setXXX and resetXXX */
  useStoreSetters<N extends Extract<keyof T, string>>(
    stateName: N
  ): {
    [SubSetState in `set${Capitalize<N>}` | `reset${Capitalize<N>}`]: Setters<T>[SubSetState]
  }
  useStoreSetters(): Setters<T>

  /** can only access setXXX and resetXXX */
  useStoreValues<N extends Extract<keyof T, string>>(stateName: N): { [subName in N]: T[keyof T] }
  useStoreValues(): T
} => {
  const { ContextProvider, useStore, useStoreSetters, useStoreValues, getStoreState, ...subHooks } =
    createContextStoreCore(initStoreObject, {
      ...options,
      subHooks: map(initStoreObject, (defaultValue, stateName) => [stateName as string])
    })

  const useSubHooks = ((stateName: keyof T) => {
    assert(stateName in subHooks, 'no this state', (err) => console.log(Object.keys(subHooks)))
    // @ts-expect-error force
    const { [stateName]: state } = subHooks[stateName]()

    const allSetters = useStoreSetters()

    const setStateName = 'set' + toPascalCase(stateName as string)
    const resetStateName = 'reset' + toPascalCase(stateName as string)
    // @ts-expect-error force
    const { [setStateName]: setState, [resetStateName]: resetState } = allSetters
    assert(setState, 'no this setState', (err) => console.log(Object.keys(allSetters)))
    return { [stateName]: state, [setStateName]: setState, [resetStateName]: resetState }
  }) as any

  const useSmartStore = (stateName?: keyof T) => (stateName === undefined ? useStore() : useSubHooks(stateName))

  return {
    ContextProvider,
    useStoreSetters: useStoreSetters as any,
    useStore: useSmartStore,
    useStoreValues,
    getStoreState
  }
}
