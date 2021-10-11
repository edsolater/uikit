import { shrinkToValue } from '@edsolater/fnkit/src/magic'
import { toCamelCase } from '@edsolater/fnkit/src/string/changeCase'
import React, { createContext, RefObject, useContext, useEffect, useMemo, useState } from 'react'

type MayStateFn<T> = T | ((prev: T) => T)
type StoreTemplate = { [key: string]: any }

type Setters<S extends StoreTemplate> = {
  /**
   *  will be merged to the store
   */
  set<P extends keyof S>(propName: P, value: MayStateFn<S[P]>): void
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
} &
  {
    [K in `reset${Capitalize<Extract<keyof S, string>>}`]: () => void
  }

export type GetUseDataHooks<T extends StoreTemplate> = () => T & Setters<T>

const getSetters = <S extends StoreTemplate>(
  initStore: Partial<S>,
  setStore: React.Dispatch<React.SetStateAction<S>>
): Setters<S> => {
  const basicSetMethod = {
    set(p, v) {
      setStore((oldStore) => ({
        ...oldStore,
        [p]: shrinkToValue(v, [oldStore[p]])
      }))
    },
    reset(p: keyof S) {
      setStore((oldStore) => ({ ...oldStore, [p]: initStore[p] }))
    },

    setAll(inputStore) {
      setStore((oldStore) => ({ ...shrinkToValue(inputStore, [oldStore]) }))
    },
    resetAll() {
      setStore(initStore as S)
    }
  }
  // @ts-expect-error force
  return new Proxy(basicSetMethod, {
    get(target, p: string) {
      if (typeof p !== 'string') return // react devtool may pass this a symbol
      if (p in target) return target[p]
      if (p.startsWith('set'))
        return (dispatchNewState) => {
          const realPropertyName = toCamelCase(p.replace(/^set/, ''))
          basicSetMethod.set(realPropertyName, dispatchNewState)
        }
      if (p.startsWith('reset')) {
        return () => {
          const realPropertyName = toCamelCase(p.replace(/^reset/, ''))
          basicSetMethod.reset(realPropertyName)
        }
      }
    }
  })
}

/**
 * Creact a store.
 * No need useContext.
 *
 * @param initStoreObject pass init states here
 * @returns
 * 1. Provider(just wrapped in Root level.no props need)
 * 2. useStore -- a hook to exact state and setters in Provider.(state and setters will merge into a big object)
 * 3. useStoreRaw -- a hook to exact state and setters in Provider.(state and setters will NOT merge)
 * @example
 * // in parent component
 * const { Provider, useStore } = createStoreContext({ count: 1, init: false })
 * return <Provider>{props.children}</Provider>
 *
 * // in child component
 * cosnt { count, setCount } = useStore()
 *
 */
// TODO: remove setter, store, action . it's tedious
export default function createStore<T extends StoreTemplate>(
  options: {
    /** easier debug rerender */
    key?: string
    initStoreObject?: T
    /** invoke once, useEffect for `<Provider/>` */
    initEffect?(storeInfos: T & Setters<T>): void
  } = {}
): {
  /** clean version of `useStore()`  */
  useProviderData(): T & Setters<T>
  /**
   * It should be add to component tree root(without any props)
   */
  Provider: (props: { componentRef?: RefObject<any>; children?: React.ReactNode }) => JSX.Element
} {
  const Context = createContext({
    store: new Proxy(options.initStoreObject ?? {}, {
      get() {
        throw new Error(`no target ${options.key}Provider above`)
      }
    }),
    setters: new Proxy(
      {},
      {
        get() {
          throw new Error(`no target ${options.key}Provider above`)
        }
      }
    ) as any
  })
  const Provider = ({ children }: { children: any }) => {
    const [store, setEntireStore] = useState(options.initStoreObject ?? {})
    const setters = useMemo(() => getSetters<T>(options.initStoreObject ?? {}, setEntireStore), [])
    const contextValue = useMemo(() => ({ store, setters }), [store])

    const merged = Object.assign(setters, store) as T & Setters<T> // can't use object desctruction

    useEffect(() => {
      options.initEffect?.(merged)
    }, [])

    return React.createElement(Context.Provider, { value: contextValue }, children)
  }
  Provider.displayName = `${options.key}`

  return {
    Provider,
    useProviderData() {
      const { setters = {}, store = {} } = useContext(Context)
      return Object.assign(setters, store)
    }
  } as any
}
