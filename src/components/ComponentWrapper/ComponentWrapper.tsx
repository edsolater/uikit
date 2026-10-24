/**
 * ComponentWrapper 为组件提供透明的结构查看边界。
 *
 * 统一选择用途说明并保留真实节点范围，组件卸载时释放边界。
 *
 * 包裹不增加原生元素，使表格、选项与多根内容保持原有关系。
 */
import { createContext, onCleanup, useContext, val, type JSX, type Source } from '@/foundation'

/** 组件使用处提供用途及定位模式中的显示选择，不影响正常界面内容。 */
export interface ComponentDescriptionProps {
  description?: Source<string | undefined>
  /** false时定位模式隐藏本体与自身、子组件标注，保留原布局和来源。 */
  descriptionDisplay?: boolean
}

/** 定义端提供身份与默认用途，使用处的说明优先。 */
export interface ComponentWrapperProps extends ComponentDescriptionProps {
  componentName: string
  defaultDescription?: Source<string | undefined>
  /** 定义端的显示默认值，由定位模式的受管消费者读取。 */
  defaultDescriptionDisplay?: boolean
  /** 定义端选用纯用途标注；无用途时仍显示组件名。 */
  descriptionOnly?: boolean
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
 * 未提供 description 时才采用默认说明；空字符串只显示组件名。
 */
export function ComponentWrapper(props: ComponentWrapperProps): JSX.Element {
  if (useContext(StructureViewControl)) return props.children

  const boundary: ComponentBoundary = {
    start: document.createComment('component:start'),
    end: document.createComment('component:end'),
    colorIndex: nextColorIndex++ % 4,
    readDescriptionDisplay: () => props.descriptionDisplay ?? props.defaultDescriptionDisplay ?? true,
    readLabel: () => {
      const description = val(props.description) ?? val(props.defaultDescription)
      if (!description) return props.componentName
      return props.descriptionOnly ? description : `${props.componentName} · ${description}`
    },
  }
  componentBoundaries.add(boundary)
  onCleanup(() => componentBoundaries.delete(boundary))

  return <>{boundary.start}{props.children}{boundary.end}</>
}
