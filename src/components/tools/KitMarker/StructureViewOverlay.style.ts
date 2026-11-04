/**
 * KitMarker 结构查看模式的内部呈现。
 *
 * 分别声明顶层宿主、画布、逐框遮罩和说明文字；不接管原组件布局。
 * 模式内透明元素与裸文字规则也由此统一承接。
 */
import { rules, token } from '@/style-system'

rules('.StructureViewOverlay', {
  position: 'fixed',
  inset: 0,
  width: '100vw',
  height: '100vh',
  'max-width': 'none',
  'max-height': 'none',
  margin: 0,
  padding: 0,
  border: 0,
  background: 'transparent',
  opacity: 1,
  transform: 'none',
  transition: 'none',
  overflow: 'hidden',
  'pointer-events': 'none',
})

rules('.StructureViewOverlay::backdrop', { display: 'none' })

rules('.StructureViewOverlay > canvas', {
  position: 'absolute',
  'z-index': 1,
  inset: 0,
  width: '100%',
  height: '100%',
  'max-width': 'none',
  'max-height': 'none',
})

rules('.StructureViewOverlay > .frame', {
  position: 'absolute',
  isolation: 'isolate',
})

export const kitMarkerStructureViewMaskColor = token(
  'rgb(255 255 255 / 90%)',
  { name: 'component-marker-structure-view-mask-color' },
)
export const kitMarkerStructureViewMaskBlur = token('4px', {
  name: 'component-marker-structure-view-mask-blur',
})

rules('.StructureViewOverlay > .frame::before', {
  content: '""',
  position: 'absolute',
  inset: 0,
  'z-index': -1,
  background: kitMarkerStructureViewMaskColor,
  'backdrop-filter': token(kitMarkerStructureViewMaskBlur, {
    name: 'component-marker-structure-view-mask-filter',
    toCSSString: (value, resolve) => `blur(${resolve(value)})`,
  }),
  // 每个框的逐帧几何数据由其宿主单独传入，不作为全局视觉状态。
  'clip-path': 'var(--structure-view-mask-clip, none)',
})

rules('.StructureViewOverlay .labels', {
  'max-height': '100%',
  overflow: 'hidden',
})

export const kitMarkerStructureViewLabelColor = token('#263645', {
  name: 'component-marker-structure-view-label-color',
})

rules('.StructureViewOverlay .label', {
  display: 'block',
  'box-sizing': 'border-box',
  'max-width': '100%',
  padding: '1px 6px',
  color: kitMarkerStructureViewLabelColor,
  font: '11px/16px system-ui, sans-serif',
  'white-space': 'normal',
  'overflow-wrap': 'anywhere',
  overflow: 'hidden',
})

rules('[data-structure-view-hidden]', { opacity: '0 !important' })
rules('::highlight(uikit-structure-view-hidden)', { color: 'transparent' })
