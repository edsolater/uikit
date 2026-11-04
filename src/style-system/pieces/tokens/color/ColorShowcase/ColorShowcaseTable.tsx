/** 展示 Style System 公共颜色材料在当前主题下的实际值。 */
import { onMount, createState } from '@/foundation'
import { Piv, Table } from '@/components'
import { cssTokenName } from '@/style-system/token/css'
import { colorShowcaseMaterials } from './colorShowcaseMaterials'
import './ColorShowcaseTable.style'

const colorNumberFormatter = new Intl.NumberFormat('en-US', {
  maximumSignificantDigits: 3,
  useGrouping: false,
})

function formatColorText(color: string) {
  return color.replace(/-?\d*\.?\d+(?:e[+-]?\d+)?/gi, (value) => {
    const formatted = colorNumberFormatter.format(Number(value))
    return formatted === '-0' ? '0' : formatted
  })
}

function readColorRows() {
  const rootStyle = getComputedStyle(document.documentElement)
  return colorShowcaseMaterials.map((material) => ({
    name: cssTokenName(material),
    value: formatColorText(rootStyle.getPropertyValue(cssTokenName(material)).trim() || '未定义'),
    preview: material.name!,
  }))
}

export function ColorShowcaseTable() {
  const rows = createState<ReturnType<typeof readColorRows>>([])
  onMount(() => {
    const refresh = () => rows.set(readColorRows())
    const observer = new MutationObserver(refresh)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'style'] })
    refresh()
    return () => observer.disconnect()
  })

  return (
    <Table
      data={rows}
      keys={['name', 'value', 'preview']}
      renderParts={{
        tableCell: {
          preview: (value) => (
            <Piv class="ColorShowcasePreview" htmlProps={{ 'data-color-material': String(value) }} />
          ),
        },
      }}
    />
  )
}
