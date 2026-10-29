/**
 * ComponentMarkerStructureViewTrigger 是 ComponentMarker 结构查看模式的激活器。
 *
 * 初始关闭，点击后才显示覆盖层；卸载时释放本次查看。
 *
 * 当前以内容之外的浮动按钮呈现，并保持清晰，随时能够关闭查看。
 */
import { createState, val, Show } from '@/foundation'
import { Button } from '@/components/kits/Button/Button'
import { StructureViewControl } from './ComponentMarker'
import { StructureViewOverlay } from './StructureViewOverlay'
import './ComponentMarkerStructureViewTrigger.style'

/**
 * 手动加载组件定位框开关，切换不重建原组件。
 */
export function ComponentMarkerStructureViewTrigger() {
  let control!: HTMLButtonElement
  const enabled = createState(false)
  const pressed = enabled.map((current) =>
    current ? ('true' as const) : ('false' as const),
  )
  return (
    <StructureViewControl value={true}>
      <Button
        class="ComponentMarkerStructureViewTrigger"
        filled
        name="切换组件定位框"
        ref={(element) => {
          control = element
        }}
        htmlProps={{ 'aria-pressed': pressed }}
        onClick={() => {
          enabled.set((current) => !current)
        }}
      >
        {val(enabled) ? '关闭组件定位框' : '打开组件定位框'}
      </Button>
      <Show when={val(enabled)}>
        <StructureViewOverlay control={control} />
      </Show>
    </StructureViewControl>
  )
}
