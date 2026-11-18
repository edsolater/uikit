/**
 * 把可同时成立的组件状态接成节点属性和状态控制器。
 *
 * 保留外部状态的归属，提供响应式状态来源及附加属性。
 *
 * 组件可统一表达加载、禁用等状态，不必各自管理来源与节点映射。
 */
import {
  createState,
  val,
  type Source,
  type StateView,
  type State,
} from '@/foundation'
import { untrack } from '@/foundation/reactivity'
import { derive } from '@/hooks'
import type { ShadowProps } from '../../Piv/plugin/mergePivProps'
import { hasPropDeclaration } from '../../tools/propsDeclaration/shadowProps'

/** Status Props 中的每一个字段都是可以独立存在、也可以同时成立的状态来源。 */
export type StatusProps<StatusName extends string> = {
  [Name in StatusName]?: Source<boolean | undefined>
}

/** 本次解析中各候选的稳定 Source；持续反映当前状态，不是值快照。 */
export type StatusSources<StatusName extends string> = {
  [Name in StatusName]: Source<boolean | undefined>
}

/** 按候选原名直接读取状态，不添加前缀或改变大小写。 */
export type StatusController<StatusName extends string> = Record<
  StatusName,
  StateView<boolean>
> & {
  /** 仅修改既非创建时由外部声明、也未被当前外部声明占用的状态。 */
  setStatus(status: StatusName, value: boolean | undefined): void

  /** 响应式判断一个状态当前是否成立。 */
  hasStatus(status: StatusName): Source<boolean>
}

/** 状态解析结果；效果属性交给 Piv，状态来源与控制器供组件按需使用。 */
export type StatusPropsParseResult<StatusName extends string> = {
  /** effect 返回的附加声明与自动生成的 data-status，按该顺序交给 Piv。 */
  readonly effectResult: ShadowProps<any>[]
  readonly statusSources: StatusSources<StatusName>
  readonly controller: StatusController<StatusName>
}

/**
 * 按候选状态创建解析器，交付节点属性、持续响应的状态来源和内部控制入口。
 * 创建时已声明的状态（包括 undefined），撤去后仍不允许 setStatus 接管；后来新增的声明仅在存在时阻止内部写入。
 * 可选 effect 将状态映射为附加节点属性；自动 data-status 与其结果一起进入 effectResult。
 *
 * @example
 * const parseStatus = createStatusPropsParser({
 *   candidates: ['loading'],
 *   effect: ({ loading }) => ({ htmlProps: { 'aria-busy': loading } }),
 * })
 * const { effectResult, controller } = parseStatus({})
 * const element = <Piv shadowProps={effectResult} />
 */
export function createStatusPropsParser<
  const Candidates extends readonly string[],
>(options: {
  candidates: Candidates

  /**
   * 让组件为解析出的状态补充节点声明。
   * 接收本次解析的完整状态 Sources，返回一份 ShadowProps 或不返回。
   * 每次解析调用一次；它不是 Solid Effect，后续状态变化由同一批 Source 传递。
   */
  effect?: (
    status: StatusSources<Candidates[number]>,
  ) => ShadowProps<any> | void
}): (
  props: StatusProps<Candidates[number]>,
) => StatusPropsParseResult<Candidates[number]> {
  type StatusName = Candidates[number]

  /**
   * 为这次组件调用建立状态来源与控制器，并收集交给节点的属性。
   */
  return function parseStatusProps(
    props: StatusProps<StatusName>,
  ): StatusPropsParseResult<StatusName> {
    // 固定初始外部归属，避免撤去声明后内部意外接管。
    const candidates: readonly StatusName[] = options.candidates
    const initiallyExternal = new Set(
      untrack(() =>
        candidates.filter((name) => hasPropDeclaration(props, name)),
      ),
    )
    // 建立持续读取的状态来源和只读视图；内部写入不回写上游。
    // 候选全集逐项构造同名记录，Object.fromEntries 不保留该键域证明。
    const statusStates = Object.fromEntries(
      candidates.map((statusName) => [
        statusName,
        createState(() => props[statusName]),
      ]),
    ) as Record<StatusName, State<boolean | undefined>>
    const statusSources: StatusSources<StatusName> = statusStates
    const statusViews = Object.fromEntries(
      candidates.map((statusName) => [
        statusName,
        derive(statusStates[statusName], Boolean),
      ]),
    ) as Record<StatusName, StateView<boolean>>
    // 操作入口还要检查当前声明，尊重创建后新增的外部状态。
    const statusController: StatusController<StatusName> = {
      ...statusViews,
      /**
       * 仅在初始和当前都无外部声明时，修改本实例的状态。
       */
      setStatus(status, value) {
        if (initiallyExternal.has(status) || hasPropDeclaration(props, status))
          return
        statusStates[status].set(value)
      },
      /**
       * 提供该状态是否成立的响应式只读视图。
       */
      hasStatus(status) {
        return statusViews[status]
      },
    }

    // 按候选顺序生成当前成立的 data-status。
    const statusAttribute = derive(statusSources, (states) => {
      const activeStatuses = options.candidates.filter(
        (statusName) => val(states[statusName]) === true,
      )
      return activeStatuses.length > 0 ? activeStatuses.join(' ') : undefined
    })

    const effectResult: ShadowProps<any>[] = []

    // 收集附加属性；自动状态属性后置，保证 data-status 由解析结果决定。
    const statusEffectResult = options.effect?.(statusSources)
    if (statusEffectResult) effectResult.push(statusEffectResult)
    effectResult.push({ htmlProps: { 'data-status': statusAttribute } })

    return {
      effectResult,
      statusSources,
      controller: statusController,
    }
  }
}
