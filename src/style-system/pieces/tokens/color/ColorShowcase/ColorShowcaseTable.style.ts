/** 颜色材料预览直接消费 Style System Token，保留透明度棋盘格。 */
import { rules, createJSSContent } from '@/style-system'
import { colorShowcaseMaterials } from './colorShowcaseMaterials'

rules('.ColorShowcasePreview', {
  'background-size': '100% 100%, 16px 16px',
  'min-inline-size': '120px',
  'block-size': '32px',
})
for (const material of colorShowcaseMaterials) {
  const preview = createJSSContent(
    (resolve) => {
      const color = resolve(material)
      return `linear-gradient(${color}, ${color}), conic-gradient(#d8dbe1 25%, #ffffff 0 50%, #d8dbe1 0 75%, #ffffff 0)`
    },
    [material],
  )
  rules(`.ColorShowcasePreview[data-color-material="${material.name}"]`, {
    'background-image': preview,
  })
}
