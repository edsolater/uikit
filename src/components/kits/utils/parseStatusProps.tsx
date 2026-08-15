import { createComputed } from 'solid-js'
import { createState, derive, val, type Source, type State } from '../../../hooks'
import type { ShadowProps } from '../../Piv/plugin/handlePivPlugin'

/** Status Props 中的每一个字段都是可以独立存在、也可以同时成立的状态来源。 */
export type StatusProps<StatusName extends string> = {
  [Name in StatusName]?: Source<boolean | undefined>
}

export type StatusDetails<StatusName extends string> = {
  [Name in StatusName]: Source<boolean | undefined>
}

export interface StatusActions<StatusName extends string> {
  /** 外部没有声明该状态时，从组件内部改变它；外部已声明时调用保持无效且不报错。 */
  setStatus(status: StatusName, value: boolean | undefined): void

  /** 响应式判断一个状态当前是否成立。 */
  hasStatus(status: StatusName): Source<boolean>
}

/**
 * 创建组件专用的 Status Props 解析器。
 *
 * Status 天然允许多个候选同时成立。外部一旦声明某个状态字段，该字段便始终跟随外部 Source；
 * 只有外部没有声明的状态才能由 statusActions 从组件内部改变。
 */
export function createStatusPropsParser<const Candidates extends string[]>(options: {
  candidates: Candidates

  /**
   * 根据完整 Status Source Record 补充 Piv props，只在解析组件 props 时执行一次。
   * 后续变化由这些 Source 自身继续驱动，不会再次执行 effect。
   */
  effect?: (
    status: StatusDetails<Candidates[number]>,
  ) => ShadowProps<any> | void
}) {
  type StatusName = Candidates[number]

  return function parseStatusProps(props: StatusProps<StatusName>) {
    const propRecord = props as Record<string, unknown>
    const externalStatusNames = new Set(
      options.candidates.filter((statusName) => statusName in props),
    )
    const internalStatusStates = {} as Record<StatusName, State<boolean | undefined>>
    const statusDetails = {} as StatusDetails<StatusName>

    for (const statusName of options.candidates) {
      const internalStatus = createState<boolean | undefined>()
      internalStatusStates[statusName] = internalStatus
      statusDetails[statusName] = externalStatusNames.has(statusName)
        ? propRecord[statusName] as Source<boolean | undefined>
        : internalStatus
    }

    const statusActions: StatusActions<StatusName> = {
      setStatus(status, value) {
        if (externalStatusNames.has(status)) return
        internalStatusStates[status].set(value)
      },
      hasStatus(status) {
        return derive(statusDetails[status], Boolean)
      },
    }

    const statusAttribute = createState<string | undefined>()
    createComputed(() => {
      const activeStatuses = options.candidates.filter(
        (statusName) => val(statusDetails[statusName]) === true,
      )
      statusAttribute.set(activeStatuses.length > 0 ? activeStatuses.join(' ') : undefined)
    })

    const statusShadowProps: ShadowProps<any> = {
      htmlProps: { 'data-status': statusAttribute },
    }

    // effect 只建立一次附加声明；返回 props 内的 Source 会由 Piv 持续消费。
    const effectShadowProps = options.effect?.(statusDetails)
    if (effectShadowProps) statusShadowProps.shadowProps = effectShadowProps

    return {
      details: statusDetails,
      statusActions,
      statusShadowProps,
    }
  }
}
