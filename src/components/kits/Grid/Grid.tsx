/**
 * Grid 按列结构组织内容。
 *
 * 以等宽列数或明确列模板排列，可选择窄视口是否回到单列。
 *
 * 统一内容空间，不接管子组件的样式。
 */
import { kit, type KitController } from '@/components/tools/kit'
import type { RefReceiver } from '@/hooks/createRef'
import { gridPropsDefinition } from './Grid.prop'
import type { ComponentDescriptionProps } from '@/components/tools/KitMarker/KitMarker'
import { type Source, type JSX, val } from '@/foundation'
import { Piv } from '@/components/Piv/Piv'
import './Grid.style'
/** Grid 的声明输入；初始状态通过 Props 表达。 */
export type GridProps = ComponentDescriptionProps & {
  ref?: RefReceiver<GridController>
  /** 数字表示等宽列数；字符串直接表示 CSS 列模板，例如 repeat(auto-fit, minmax(12rem, 1fr))。 */
  columns?: Source<number | string>
  /** 默认窄于 48rem 时收为单列；false 保持指定列结构。 */
  responsive?: Source<boolean>
  grow?: Source<boolean | undefined>
  label?: Source<string | undefined>
  children?: JSX.Element
}

/** Grid 自有 Props 的指令式入口；ref 只从上游交付。 */
export type GridController = KitController<GridProps, typeof gridPropsDefinition>

/**
 * 按列数或列模板分栏，固定间隔 1rem；默认一列且窄屏收为单列，responsive=false 时保持列结构。
 */
export const Grid = kit(
  {
    name: 'Grid',
    description: '按列结构组织内容',
    availableProps: gridPropsDefinition,
  },
  (props: GridProps) => {
    return (
      <Piv class="Grid"
        style={{ '--grid-columns': typeof val(props.columns) === 'string'
          ? val(props.columns) : `repeat(${val(props.columns) ?? 1}, minmax(0, 1fr))` }}
        htmlProps={{ 'data-responsive': String(val(props.responsive) ?? true), 'data-grow': String(val(props.grow) ?? false), 'aria-label': props.label }}>
        {props.children}
      </Piv>
    )
  },
)
