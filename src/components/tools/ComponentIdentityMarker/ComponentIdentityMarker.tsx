/**
 * ComponentIdentityMarker 为组件提供透明的结构查看边界。
 *
 * 分别呈现组件定义职责与实例名称并保留真实节点范围，组件卸载时释放边界。
 *
 * 标记不增加原生元素，使表格、选项与多根内容保持原有关系。
 */
import {
  createContext,
  onCleanup,
  useContext,
  val,
  type JSX,
} from '@/foundation'
import type { PivProps } from '../../Piv/Piv'

/** 组件实例在结构查看中的显示选择，不影响正常界面内容。 */
export interface ComponentIdentityMarkerDisplayProps {
  /** false时定位模式隐藏本体与自身、子组件标注，保留原布局和来源。 */
  descriptionDisplay?: boolean
}

/** 定义职责与实例名称分别呈现，二者不会互相覆盖或回退。 */
export interface ComponentIdentityMarkerProps extends ComponentIdentityMarkerDisplayProps {
  componentName: string
  /**
   * 组件定义提供的固定职责，说明 Component 本身，不作为具体实例名称或原生无障碍名称。
   * Kit 组件从 KitOptions.description 转交，手写标记在定义处提供。
   */
  description?: string
  /**
   * 消费 PivProps.label，说明具体 Component 实例的业务名称。
   * 这里只呈现同一份输入，不重新拥有 label 协议或接管节点语义。
   */
  label?: PivProps['label']
  /** 定义端的显示默认值，由定位模式的受管消费者读取。 */
  defaultDescriptionDisplay?: boolean
  /** 文字语义组件只标实例名称；没有名称时仍显示组件名。 */
  labelOnly?: boolean
  children?: JSX.Element
}

/** 一次挂载中的真实组件范围，颜色在该实例存活期间稳定。 */
export interface ComponentBoundary {
  start: Comment
  end: Comment
  colorIndex: number
  readLabel: () => string
  readDescriptionDisplay: () => boolean
}

export const componentBoundaries = new Set<ComponentBoundary>()
export const StructureViewControl = createContext(false)
let nextColorIndex = 0

/**
 * 保留主体与响应式子树，只为结构查看提供组件身份、用途和节点范围。
 * 定义职责与实例名称保持独立；清空实例名称不会改变定义职责。
 */
export function ComponentIdentityMarker(props: ComponentIdentityMarkerProps): JSX.Element {
  if (useContext(StructureViewControl)) return props.children

  const boundary: ComponentBoundary = {
    start: document.createComment('component:start'),
    end: document.createComment('component:end'),
    colorIndex: nextColorIndex++ % 4,
    readDescriptionDisplay: () =>
      props.descriptionDisplay ?? props.defaultDescriptionDisplay ?? true,
    readLabel: () => {
      const label = val(props.label)
      if (props.labelOnly) return label || props.componentName
      return [props.componentName, props.description, label]
        .filter(Boolean)
        .join(' · ')
    },
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
