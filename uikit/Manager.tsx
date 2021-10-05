import { Context, createContext, FC, ReactNode, useEffect } from 'react'
import { Div } from '.'
import createStore, { GetUseDataHooks } from '../functions/react/createStore'

type RecordKey = string
type ManagerComponent = (props: Record<string, any>) => JSX.Element
type UserDefinedToRecordedState = Record<string, any>

const managerStakeRecord = new Map<RecordKey, ManagerComponent>()

/**
 * @tags componentFactory
 */
export default function createManager<S extends UserDefinedToRecordedState>({
  key: rootName,
  childrenKeys
}: {
  key: string
  childrenKeys: string[]
}): {
  (props: { children?: ReactNode }): JSX.Element
  managerHook: GetUseDataHooks<S>
  Foo: (props: { children?: ReactNode }) => JSX.Element
} {
  if (!managerStakeRecord.has(rootName)) {
    const Manager = _createManager<S>(rootName, childrenKeys)
    // @ts-expect-error force
    managerStakeRecord.set(rootName, Manager)
  }
  // @ts-expect-error force
  return managerStakeRecord.get(rootName)
}

function _createManager<S extends UserDefinedToRecordedState>(rootName: string, childrenKeys: string[]) {
  // TEMP
  const { Provider: ManagerProvider, useProviderData: useManagerData } = createStore<{ text: string }>({
    ProviderName: `${rootName}Context`
  })

  const Manager: FC<{ children?: ReactNode }> = ({ children }) => <ManagerProvider>{children}</ManagerProvider>
  Manager.displayName = rootName

  const children = Object.fromEntries(
    // TODO: create From keys
    childrenKeys.map((childName) => {
      const ManagerChild: FC<{ children?: string }> = ({ children }) => {
        const { text, setText } = useManagerData()
        useEffect(() => {
          if (text !== children) setText(children ?? '')
        }, [])
        return <Div>{children}</Div>
      }
      ManagerChild.displayName = `${rootName}.${childName}`
      return [childName, ManagerChild]
    })
  )
  Object.assign(Manager, children, { managerHook: useManagerData })
  return Manager
}
