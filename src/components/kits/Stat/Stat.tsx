/** 在内容频繁变化时保持信息单元的阅读位置。 */
import { createState, val } from '@/foundation'
import { Piv } from '../../Piv/Piv'
import { kit, type KitComponent } from '../../tools/kit'
import {
  componentName,
  statPropDefinition,
  type StatProps,
  type StatController,
} from './Stat.prop'
import './Stat.style'

/**
 * 承载任意读数、说明或组合内容。初次为空时预留一行，随后保留本实例
 * 已呈现内容的最大高度。传入 fitContent 时跟随当前内容收放。
 */
export const Stat: KitComponent<{
  props: StatProps
  controller: StatController
}> = kit(
  {
    name: componentName,
    componentDescription: '承载动态信息',
    propDefinition: statPropDefinition,
  },
  (props, { name }) => {
    const tallest = createState(0)
    return (
      <Piv
        shadowProps={props}
        class={name}
        htmlProps={{
          'data-fit-content': val(props.fitContent) ? '' : undefined,
        }}
        style={{ '--stat-content-height': `${val(tallest)}px` }}
      >
        <Piv
          class="StatContent"
          domRef={content => {
            const observer = new ResizeObserver(([entry]) => {
              const height = entry.borderBoxSize[0].blockSize
              if (height > val(tallest)) tallest.set(height)
            })
            observer.observe(content, { box: 'border-box' })
            return () => observer.disconnect()
          }}
        >
          {props.children}
        </Piv>
      </Piv>
    )
  },
)
