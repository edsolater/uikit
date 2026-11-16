/**
 * ComponentIdentityMarker 为组件提供透明的结构查看边界。
 *
 * 按实例名称、组件定义职责的顺序选取标注，并保留真实节点范围，组件卸载时释放边界。
 *
 * 标记不增加原生元素，使表格、选项与多根内容保持原有关系。
 */
import { resolvePivLabel } from '../../Piv/label'
import { createContext, onCleanup, useContext, type JSX } from '@/foundation'
import type { PivProps } from '../../Piv/Piv'

/** 组件实例在结构查看中的显示选择，不影响正常界面内容。 */
export interface ComponentIdentityMarkerDisplayProps {
  /** false时定位模式隐藏本体与自身、子组件标注，保留原布局和来源。 */
  descriptionDisplay?: boolean
}

/** 标注优先使用实例名称，没有实例名称时使用组件定义职责。 */
export interface ComponentIdentityMarkerProps extends ComponentIdentityMarkerDisplayProps {
  componentName: string
  /**
   * 组件定义提供的固定职责，说明 Component 本身，不作为具体实例名称或原生无障碍名称。
   * Kit 组件从 KitOptions.componentDescription 转交，手写标记在定义处提供。
   */
  componentDescription?: string
  /**
   * 消费 PivProps.label，说明具体 Component 实例的业务名称。
   * 这里只呈现同一份输入，不重新拥有 label 协议或接管节点语义。
   */
  label?: PivProps['label']
  children?: JSX.Element
}

/** 一次挂载中的真实组件范围，颜色在该实例存活期间稳定。 */
export interface ComponentBoundary {
  /** 固定组件身份，供结构检查识别，不作为标注文案回退。 */
  componentName: string
  start: Comment
  end: Comment
  colorIndex: number
  readLabel: () => string | undefined
  readDescriptionDisplay: () => boolean | undefined
}

export const componentBoundaries = new Set<ComponentBoundary>()
export const StructureViewControl = createContext(false)
let nextColorIndex = 0

/**
 * 保留主体与响应式子树，只为结构查看提供组件身份、用途和节点范围。
 * 实例名称为空时用定义职责标注；两者均为空时默认不画自身范围，不隐藏其它组件。
 */
export function ComponentIdentityMarker(
  props: ComponentIdentityMarkerProps,
): JSX.Element {
  if (useContext(StructureViewControl)) return props.children

  const boundary: ComponentBoundary = {
    componentName: props.componentName,
    start: document.createComment('component:start'),
    end: document.createComment('component:end'),
    colorIndex: nextColorIndex++ % 4,
    readDescriptionDisplay: () =>
      props.descriptionDisplay ?? (boundary.readLabel() ? true : undefined),
    readLabel: () =>
      resolvePivLabel(props.label) || props.componentDescription || undefined,
  }
  componentBoundaries.add(boundary)
  onCleanup(() => componentBoundaries.delete(boundary))

  return (
    <>
      {boundary.start}
      {props.children}
      {boundary.end}
    </>
  )
}
