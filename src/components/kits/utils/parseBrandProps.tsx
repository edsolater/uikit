import { createComputed } from 'solid-js'
import { createState, val, type Source } from '../../../hooks'
import type { ShadowProps } from '../../Piv/plugin/handlePivPlugin'

/**
 * 定义一个 Brand 分组的两种输入轮廓。
 *
 * Candidate 对应 `small` 这类确定描述词：具体 Brand 已知，值只决定它是否存在。
 * GroupName 对应 `size` 这类不定字段：只知道分类，具体 Brand 由字段当前值决定。
 */
export type BrandProps<GroupName extends string, Candidate extends string> = {
  [Name in Candidate]?: Source<boolean | undefined>
} & {
  [Name in GroupName]?: Source<Candidate | undefined>
}

export interface BrandPropsGroup<GroupName extends string = string, Candidate extends string = string> {
  groupName: GroupName
  candidates: Candidate[]

  /**
   * 根据解析结果补充当前 Brand 的 Piv props，只在解析组件 props 时执行一次。
   * 后续变化由传入的 Source 自身继续驱动，不会再次执行 effect。
   */
  effect?: (selectedBrand: Source<Candidate | undefined>) => ShadowProps<any> | void
}

export type BrandDetails<Groups extends BrandPropsGroup[]> = {
  [Group in Groups[number] as Group['groupName']]: Source<Group['candidates'][number] | undefined>
}

/**
 * 为组件声明的互斥 Brand 分组创建解析器。
 *
 * 确定描述词优先用于阅读；不定字段一旦声明便接管整个分组，即使当前值是 undefined 也不会回落。
 * 每个分组最多产生一个 Brand；多个确定描述词同时声明时只警告，不中断组件运行。
 */
export function createBrandPropsParser<const Groups extends BrandPropsGroup[]>(groups: Groups) {
  return function parseBrandProps(props: object) {
    const detailsRecord: Record<string, Source<string | undefined>> = {}
    const brandHTMLProps: Record<`data-${string}`, Source<string | undefined>> = {}
    const brandEffectShadowProps: ShadowProps<any>[] = []

    for (const group of groups) {
      const selectedBrand = parseBrandGroup(props, group)
      detailsRecord[group.groupName] = selectedBrand
      brandHTMLProps[`data-${group.groupName}`] = selectedBrand

      // effect 只建立一次附加声明；返回 props 内的 Source 会由 Piv 持续消费。
      const effectShadowProps = group.effect?.(selectedBrand)
      if (effectShadowProps) brandEffectShadowProps.push(effectShadowProps)
    }

    const brandShadowProps: ShadowProps<any> = { htmlProps: brandHTMLProps }
    if (brandEffectShadowProps.length > 0) {
      brandShadowProps.shadowProps = brandEffectShadowProps
    }

    return {
      details: detailsRecord as BrandDetails<Groups>,
      brandShadowProps,
    }
  }
}

function parseBrandGroup(props: object, group: BrandPropsGroup): Source<string | undefined> {
  const propRecord = props as Record<string, unknown>
  const hasGroupProp = group.groupName in props
  const declaredCandidates = group.candidates.filter((candidate) => candidate in props)

  if (hasGroupProp && declaredCandidates.length > 0) {
    console.warn(
      `[UIKit/BrandProps] “${group.groupName}”分组输入冲突：同时声明了不定字段“${group.groupName}”和确定描述词` +
      `${formatCandidates(declaredCandidates)}。“${group.groupName}”接管整个分组，确定描述词被忽略。`,
    )
  } else if (declaredCandidates.length > 1) {
    console.warn(
      `[UIKit/BrandProps] “${group.groupName}”分组输入冲突：同时声明了多个确定描述词${formatCandidates(declaredCandidates)}。` +
      `解析器仍按 candidates 的定义顺序采用第一个当前成立的描述词，请只保留一个。`,
    )
  }

  if (hasGroupProp) return propRecord[group.groupName] as Source<string | undefined>

  const selectedBrand = createState<string | undefined>()
  createComputed(() => {
    selectedBrand.set(
      group.candidates.find(
        (candidate) => val(propRecord[candidate] as Source<boolean | undefined>) === true,
      ),
    )
  })
  return selectedBrand
}

function formatCandidates(candidates: string[]): string {
  return candidates.map((candidate) => `“${candidate}”`).join('、')
}
