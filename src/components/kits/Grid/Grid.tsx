/**
 * Grid 以等宽列组织内容。
 *
 * 按指定列数排列，并在窄视口回到单列。
 *
 * 统一内容空间，不接管子组件的样式。
 */
import { kit, type KitController } from '@/components/utils/kit'
import type { RefReceiver } from '@/hooks/createRef'
import { gridPropsDefinition } from './Grid.prop'
import type { ComponentDescriptionProps } from '@/components/ComponentMarker/ComponentMarker'
import { type Source, type JSX } from '@/foundation'
import { Piv } from '@/components/Piv/Piv'
import './Grid.style'
/** Grid 的声明输入；初始状态通过 Props 表达。 */
export type GridProps = ComponentDescriptionProps & {
  ref?: RefReceiver<GridController>
  columns?: Source<1 | 2 | 3>
  children?: JSX.Element
}

/** Grid 自有 Props 的指令式入口；ref 只从上游交付。 */
export type GridController = KitController<GridProps, typeof gridPropsDefinition>

/**
 * 默认一列，按 columns 等宽分栏并固定间隔 1rem；视口宽度小于 48rem 时统一为单列。
 */
export const Grid = kit(
  {
    name: 'Grid',
    description: '以等宽列组织内容',
    availableProps: gridPropsDefinition,
  },
  (props: GridProps) => {
    return (
      <Piv class="Grid" htmlProps={{ 'data-columns': props.columns ?? 1 }}>
        {props.children}
      </Piv>
    )
  },
)
