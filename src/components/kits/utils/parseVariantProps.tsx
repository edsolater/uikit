/**
 * 组件 Variant Props 解析器。
 *
 * 负责互斥分组的选中值和属性映射，不负责选中值对应的业务动作。
 *
 * 让输入选择规则与后续响应式读取保持在同一条 Source 链上。
 */
import { derive } from '@/hooks'
import { val, type Source } from '@/foundation'
import type { ShadowProps } from '../../Piv/plugin/handlePivPlugin'
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

export interface VariantPropsGroup<GroupName extends string = string, Candidate extends string = string> {
  groupName: GroupName
  candidates: Candidate[]

  /**
   * 根据解析结果补充当前 Variant 的 Piv props，只在解析组件 props 时执行一次。
   * 后续变化由传入的 Source 自身继续驱动，不会再次执行 effect。
   */
  effect?: (selectedVariant: Source<Candidate | undefined>) => ShadowProps<any> | void
}

export type VariantDetails<Groups extends VariantPropsGroup[]> = {
  [Group in Groups[number] as Group['groupName']]: Source<Group['candidates'][number] | undefined>
}

/**
 * 为组件声明的互斥 Variant 分组创建解析器。
 *
 * 确定描述词优先用于阅读；不定字段一旦声明便接管整个分组，即使当前值是 undefined 也不会回落。
 * 每个分组最多产生一个 Variant；多个确定描述词同时声明时只警告，不中断组件运行。
 */
export function createVariantPropsParser<const Groups extends VariantPropsGroup[]>(
  groups: Groups,
  mapping?: Record<string, Record<string, string | undefined>>,
) {
  return function parseVariantProps(props: object) {
    const detailsRecord: Record<string, Source<string | undefined>> = {}
    const variantHTMLProps: Record<`data-${string}`, Source<string | undefined>> = {}
    const variantEffectShadowProps: ShadowProps<any>[] = []

    for (const group of groups) {
      const selectedVariant = parseVariantGroup(props, group)
      detailsRecord[group.groupName] = selectedVariant
      const groupMapping = mapping && Object.hasOwn(mapping, group.groupName) ? mapping[group.groupName] : undefined
      variantHTMLProps[`data-${group.groupName}`] = groupMapping ? mapVariantProps(selectedVariant, groupMapping) : selectedVariant

      // effect 只建立一次附加声明；返回 props 内的 Source 会由 Piv 持续消费。
      const effectShadowProps = group.effect?.(selectedVariant)
      if (effectShadowProps) variantEffectShadowProps.push(effectShadowProps)
    }

    const variantShadowProps: ShadowProps<any> = { htmlProps: variantHTMLProps }
    if (variantEffectShadowProps.length > 0) {
      variantShadowProps.shadowProps = variantEffectShadowProps
    }

    return {
      details: detailsRecord as VariantDetails<Groups>,
      variantShadowProps,
    }
  }
}

function parseVariantGroup(props: object, group: VariantPropsGroup): Source<string | undefined> {
  const propRecord = props as Record<string, unknown>
  const hasGroupProp = group.groupName in props
  const declaredCandidates = group.candidates.filter((candidate) => candidate in props)

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

  if (hasGroupProp) return propRecord[group.groupName] as Source<string | undefined>

  return derive(propRecord, () => {
    return group.candidates.find(
      (candidate) => val(propRecord[candidate] as Source<boolean | undefined>) === true,
    )
  })
}

function formatCandidates(candidates: string[]): string {
  return candidates.map((candidate) => `“${candidate}”`).join('、')
}
