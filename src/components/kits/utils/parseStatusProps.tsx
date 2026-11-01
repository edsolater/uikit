/**
 * 组件 Status Props 解析器。
 *
 * 负责外部状态归属、内部状态操作和状态属性派生，不负责状态对应的业务动作。
 *
 * 让多个可同时成立的状态保持为统一的 Source。
 */
import {
  createState,
  stateView,
  val,
  type Source,
  type State,
  type StateView,
} from '@/foundation'
import { toRecord } from '@edsolater/fnkit'
import { derive } from '@/hooks'
import type { ShadowProps } from '../../Piv/plugin/handlePivPlugin'

/** Status Props 中的每一个字段都是可以独立存在、也可以同时成立的状态来源。 */
export type StatusProps<StatusName extends string> = {
  [Name in StatusName]?: Source<boolean | undefined>
}

export type StatusDetails<StatusName extends string> = {
  [Name in StatusName]: Source<boolean | undefined>
}

/** 按候选原名直接读取状态，不添加前缀或改变大小写。 */
export type StatusController<StatusName extends string> = Record<
  StatusName,
  StateView<boolean>
> & {
  /** 外部没有声明该状态时，从组件内部改变它；外部已声明时调用保持无效且不报错。 */
  setStatus(status: StatusName, value: boolean | undefined): void

  /** 响应式判断一个状态当前是否成立。 */
  hasStatus(status: StatusName): Source<boolean>
}

/** 状态解析结果；效果属性交给 Piv，状态来源与控制器供组件按需使用。 */
export type StatusPropsParseResult<StatusName extends string> = {
  readonly effect: ShadowProps<any>[]
  readonly details: StatusDetails<StatusName>
  readonly controller: StatusController<StatusName>
}

/**
 * 创建组件专用的 Status Props 解析器。
 *
 * Status 天然允许多个候选同时成立。外部一旦声明某个状态字段，该字段便始终跟随外部 Source；
 * 只有外部没有声明的状态才能由返回的 controller 从组件内部改变。
 *
 * @param options 状态候选及可选的附加效果属性生成函数。
 * @returns 解析函数，接收状态 Props 并返回 { effect, details, controller }：
 * - effect 是可展开到 Piv shadowProps 的属性列表；先放 effect 返回的属性，
 *   再放自动生成的 data-status 属性，同名字段由后者覆盖，不额外嵌套 shadowProps。
 * - details 按候选原名提供响应式状态 Source；多个状态可以同时成立。
 * - controller 提供状态读取与内部状态操作，不能接管已由外部声明的状态。
 * 每次解析只执行一次 effect；后续变化由返回属性中的 Source 驱动。
 *
 * @example
 * ```tsx
 * const parseStatusProps = createStatusPropsParser({ candidates: ['loading'] })
 * const { effect: effectProps, details, controller: statusController } = parseStatusProps({})
 * statusController.setStatus('loading', true)
 * val(details.loading) // true
 * // effectProps 中的 data-status 属性来源随状态变化，当前值为 'loading'。
 * const element = <Piv shadowProps={effectProps} />
 * ```
 */
export function createStatusPropsParser<
  const Candidates extends string[],
>(options: {
  candidates: Candidates

  /**
   * 根据完整 Status Source Record 补充 Piv props，只在解析组件 props 时执行一次。
   * 后续变化由这些 Source 自身继续驱动，不会再次执行 effect。
   */
  effect?: (
    status: StatusDetails<Candidates[number]>,
  ) => ShadowProps<any> | void
}): (props: StatusProps<Candidates[number]>) => StatusPropsParseResult<Candidates[number]> {
  type StatusName = Candidates[number]

  return function parseStatusProps(props: StatusProps<StatusName>): StatusPropsParseResult<StatusName> {
    const candidates: StatusName[] = options.candidates
    const propRecord = props as Record<string, unknown>
    const externalStatusNames = new Set(
      options.candidates.filter((statusName) => statusName in props),
    )
    const internalStatusStates = {} as Record<
      StatusName,
      State<boolean | undefined>
    >
    const statusDetails = {} as StatusDetails<StatusName>

    for (const statusName of options.candidates) {
      const internalStatus = createState<boolean | undefined>()
      internalStatusStates[statusName] = internalStatus
      statusDetails[statusName] = externalStatusNames.has(statusName)
        ? derive(propRecord, () =>
            val(propRecord[statusName] as Source<boolean | undefined>),
          )
        : internalStatus
    }

    const statusViews = toRecord(
      candidates,
      (statusName) => statusName,
      (statusName) => stateView(() => Boolean(val(statusDetails[statusName]))),
    )
    const statusController: StatusController<StatusName> = {
      ...statusViews,
      setStatus(status, value) {
        if (externalStatusNames.has(status)) return
        internalStatusStates[status].set(value)
      },
      hasStatus(status) {
        return statusViews[status]
      },
    }

    const statusAttribute = derive(statusDetails, () => {
      const activeStatuses = options.candidates.filter(
        (statusName) => val(statusDetails[statusName]) === true,
      )
      return activeStatuses.length > 0 ? activeStatuses.join(' ') : undefined
    })

    const effectProps: ShadowProps<any>[] = []

    // effect 只建立一次附加声明；返回 props 内的 Source 会由 Piv 持续消费。
    const statusEffectProps = options.effect?.(statusDetails)
    if (statusEffectProps) effectProps.push(statusEffectProps)
    effectProps.push({ htmlProps: { 'data-status': statusAttribute } })

    return { effect: effectProps, details: statusDetails, controller: statusController }
  }
}
