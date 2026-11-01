/**
 * 可锚定外部目标的通用浮层。
 *
 * 统一原生浮层、定位与箭头，内容及触发方式由使用方提供。
 *
 * 让提示与按钮浮层共享同一个显示实体。
 */
import { kit, type KitController } from '@/components/utils/kit'
import type { RefReceiver } from '@/hooks/createRef'
import { popoverSurfacePropsDefinition } from './PopoverSurface.prop'
import { val, type Source, type JSX } from '@/foundation'
import type { ComponentDescriptionProps } from '@/components/ComponentMarker/ComponentMarker'
import { Piv, type PivProps } from '@/components/Piv/Piv'
import './PopoverSurface.style'

/** 同一浮层的身份、目标和内容；style服务宿主布局，完整轮廓材质由公开Token控制。 */
export type PopoverSurfaceProps = Pick<
  PivProps,
  'id' | 'class' | 'style' | 'domRef' | 'on' | 'children'
> & ComponentDescriptionProps & {
  ref?: RefReceiver<PopoverSurfaceController>
  htmlProps?: JSX.HTMLAttributes<HTMLDivElement>
  anchor?: Source<string | undefined>
  placement?: Source<string | undefined>
  popover: 'auto' | 'hint' | 'manual'
}

/** 通过 props 提供浮层输入干预；ref 只从上游交付。 */
export type PopoverSurfaceController = KitController<PopoverSurfaceProps, typeof popoverSurfacePropsDefinition>

/**
 * 呈现锚定目标的浮层；调用方负责将domRef接入同一Popover Controller。
 */
export const PopoverSurface = kit(
  {
    name: 'PopoverSurface',
    description: '显示目标的浮层内容',
    availableProps: popoverSurfacePropsDefinition,
  },
  (props: PopoverSurfaceProps) => {
    return (
      <Piv
        id={props.id}
        class={['PopoverSurface', props.class]}
        style={props.style}
        domRef={props.domRef}
        on={props.on}
        htmlProps={{
          ...props.htmlProps,
          'popover': props.popover,
          'data-anchor': props.anchor,
          'data-placement': props.placement,
        }}
      >
        <Piv class="PopoverGeometry" htmlProps={{ 'aria-hidden': 'true' }}>
          <Piv class="PopoverPaint" />
        </Piv>
        {val(props.children)}
      </Piv>
    )
  },
)
