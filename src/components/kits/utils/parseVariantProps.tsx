/**
 * 把互斥的组件分类接成选中来源和节点属性。
 *
 * 统一解释分组字段、候选描述词及其 DOM 映射。
 *
 * 组件可复用选择规则，同时保留持续响应的分类来源。
 */
import { untrack } from '@/foundation/reactivity'
import { derive } from '@/hooks'
import { toRecord } from '@edsolater/fnkit'
import { val, type Source } from '@/foundation'
import type { ShadowProps } from '../../Piv/plugin/mergePivProps'
import { mapVariantProps } from './variantPropsMapping'

/**
 * 定义一个 Variant 分组的两种输入轮廓。
 *
 * Candidate 对应 `small` 这类确定描述词：具体 Variant 已知，值只决定它是否存在。
 * GroupName 对应 `size` 这类不定字段：只知道分类，具体 Variant 由字段当前值决定。
 */
export type VariantProps<GroupName extends string, Candidate extends string> = {
  [Name in Candidate]?: Source<boolean | undefined>
} & {
  [Name in GroupName]?: Source<Candidate | undefined>
}

/** 一组互斥候选、其分组字段，以及可选的节点属性映射。 */
export interface VariantPropsGroup<
  GroupName extends string = string,
  Candidate extends string = string,
> {
  groupName: GroupName
  candidates: readonly Candidate[]

  /**
   * 让分组按选中值补充节点声明。
   * 接收本次解析中该组稳定的选中 Source，返回一份 ShadowProps 或不返回。
   * 每次解析对该组调用一次；它不是 Solid Effect，后续变化由同一 Source 传递。
   */
  effect?: (
    selectedVariant: Source<Candidate | undefined>,
  ) => ShadowProps<any> | void
}

/** 按分组名保留本次解析的选中 Source，不受 DOM 映射改变。 */
export type SelectedVariants<Groups extends readonly VariantPropsGroup[]> = {
  [Group in Groups[number] as Group['groupName']]: Source<
    Group['candidates'][number] | undefined
  >
}

/** 分类解析结果；选中值保留原始语义，效果属性用于交给 Piv 渲染。 */
export type VariantPropsParseResult<
  Groups extends readonly VariantPropsGroup[],
> = {
  /** 各组 effect 返回的声明在前，自动 data-* 在后，统一交给 Piv。 */
  effectResult: ShadowProps<any>[]
  selectedVariants: SelectedVariants<Groups>
}

/**
 * 按互斥分组创建解析器，交付选中来源和用于节点的 effectResult。
 * 显式分组字段接管整组，包括 undefined；否则按候选顺序选第一个成立项，冲突仅警告。
 * mapping 只转换自动 data-* 的值，各组 effect 仍接收原始选中 Source。
 *
 * @example
 * const parseVariant = createVariantPropsParser([{
 *   groupName: 'appearance', candidates: ['filled', 'outlined'],
 *   effect: (selected) => ({ htmlProps: { 'data-selected': selected } }),
 * }])
 * const { effectResult, selectedVariants } = parseVariant({ outlined: true })
 * const element = <Piv shadowProps={effectResult} />
 */
export function createVariantPropsParser<
  Groups extends readonly VariantPropsGroup[],
>(
  groups: Groups,
  mapping?: Record<string, Record<string, string | undefined>>,
): (props: object) => VariantPropsParseResult<Groups> {
  /**
   * 为这次组件调用确定各组选中来源，收集 effect 产物和自动节点属性。
   */
  return function parseVariantProps(
    props: object,
  ): VariantPropsParseResult<Groups> {
    const selectedVariants: Record<string, Source<string | undefined>> = {}
    const variantHTMLProps: Record<
      `data-${string}`,
      Source<string | undefined>
    > = {}
    const effectResult: ShadowProps<any>[] = []

    // 逐组保留原始选中来源，仅对自动 DOM 属性应用映射。
    for (const group of groups) {
      const selectedVariant = parseVariantGroup(props, group)
      selectedVariants[group.groupName] = selectedVariant
      const groupMapping =
        mapping && Object.hasOwn(mapping, group.groupName)
          ? mapping[group.groupName]
          : undefined
      variantHTMLProps[`data-${group.groupName}`] = groupMapping
        ? mapVariantProps(selectedVariant, groupMapping)
        : selectedVariant

      // 用原始选中来源构建本组附加属性。
      const groupEffectResult = group.effect?.(selectedVariant)
      if (groupEffectResult) effectResult.push(groupEffectResult)
    }

    // 自动属性最后加入，避免附加声明覆盖实际分类的 data-*。
    effectResult.push({ htmlProps: variantHTMLProps })
    return {
      effectResult,
      selectedVariants: selectedVariants as SelectedVariants<Groups>,
    }
  }
}

/**
 * 把候选输入接成可控分组：缺省时解释候选，并在输出中省略已被分组接管的候选字段。
 * 不执行附加效果，仍由核心解析器完成节点映射和效果应用。
 */
export function createVariantInputRules(
  groups: readonly VariantPropsGroup[],
  inputProps: object,
) {
  return {
    defaultSources: toRecord(
      groups,
      group => group.groupName,
      group => (input: object) => parseVariantGroup(input, group, true),
    ),
    omit: (key: PropertyKey) =>
      groups.some(
        group =>
          group.candidates.some(candidate => candidate === key) &&
          !(group.groupName in inputProps),
      ),
  }
}

/**
 * 持续选择一组 Variant；显式分组接管候选，缺省分组模式只检查候选。
 * 构建时报告当前冲突，之后的声明变化仍参与选择。
 */
function parseVariantGroup(
  props: object,
  group: VariantPropsGroup,
  candidatesOnly = false,
): Source<string | undefined> {
  const propRecord = props as Record<string, unknown>
  // 构建时只报告当前声明冲突；真正的选值分支在下面的持续派生中决定。
  const hasGroupProp =
    !candidatesOnly && untrack(() => group.groupName in props)
  const declaredCandidates = untrack(() =>
    group.candidates.filter(candidate => candidate in props),
  )
  if (hasGroupProp && declaredCandidates.length > 0) {
    console.warn(
      `[UIKit/VariantProps] “${group.groupName}”分组输入冲突：同时声明了不定字段“${group.groupName}”和确定描述词` +
        `${formatCandidates(declaredCandidates)}。“${group.groupName}”接管整个分组，确定描述词被忽略。`,
    )
  } else if (declaredCandidates.length > 1) {
    console.warn(
      `[UIKit/VariantProps] “${group.groupName}”分组输入冲突：同时声明了多个确定描述词${formatCandidates(declaredCandidates)}。` +
        `解析器仍按 candidates 的定义顺序采用第一个当前成立的描述词，请只保留一个。`,
    )
  }

  return derive(propRecord, s => {
    if (!candidatesOnly && group.groupName in s)
      return s[group.groupName] as Source<string | undefined>
    return group.candidates.find(
      candidate => val(s[candidate] as Source<boolean | undefined>) === true,
    )
  })
}

/**
 * 将候选名称格式化为冲突说明中的可读列表。
 */
function formatCandidates(candidates: readonly string[]): string {
  return candidates.map(candidate => `“${candidate}”`).join('、')
}
