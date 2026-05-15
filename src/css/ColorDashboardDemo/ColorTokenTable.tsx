/**
 * 这个文件只负责 ColorDashboard 的颜色列表展示。
 * 它负责扫描当前页面的颜色 CSS 变量名，并整理成颜色 token 表格行。
 */
import { createEffect } from 'solid-js'
import { Piv, Table } from '../../components'
import { createState, derive } from '../../hooks'

const colorNumberFormatter = new Intl.NumberFormat('en-US', {
  maximumSignificantDigits: 3,
  useGrouping: false,
})

/**
 * 判断当前规则是否还能继续向下读取子规则。
 */
function hasNestedCssRules(rule: CSSRule): rule is CSSRule & { cssRules: CSSRuleList } {
  return 'cssRules' in rule
}

/**
 * 递归扫描样式规则，找出 :root 上声明的 --color-* 变量名。
 */
function collectColorVariableNamesFromStylesheetRules(cssRules: CSSRuleList, cssVariableNames: Set<string>) {
  for (const rule of Array.from(cssRules)) {
    if (rule instanceof CSSStyleRule && rule.selectorText === ':root') {
      for (const name of Array.from(rule.style)) {
        if (name.startsWith('--color-')) {
          cssVariableNames.add(name)
        }
      }
      continue
    }

    if (hasNestedCssRules(rule)) {
      collectColorVariableNamesFromStylesheetRules(rule.cssRules, cssVariableNames)
    }
  }
}

/**
 * 从当前页面已加载的 stylesheet 中直接提取 color CSS 变量名列表。
 */
function extractColorVariableNamesFromCurrentStylesheet() {
  const cssVariableNames = new Set<string>()

  for (const styleSheet of Array.from(document.styleSheets)) {
    try {
      collectColorVariableNamesFromStylesheetRules(styleSheet.cssRules, cssVariableNames)
    } catch {
      continue
    }
  }

  return Array.from(cssVariableNames).sort((left, right) => left.localeCompare(right))
}

/**
 * 读取 token 在根节点上的原始声明值，展示层不再改写颜色空间。
 */
function readTokenRawValue(token: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(token).trim() || '未定义'
}

/**
 * 压缩颜色表达里的数字精度，避免展示层被长小数淹没。
 */
function formatColorText(color: string) {
  return color.replace(/-?\d*\.?\d+(?:e[+-]?\d+)?/gi, (value) => {
    const numberValue = Number(value)

    if (!Number.isFinite(numberValue)) {
      return value
    }

    const formattedValue = colorNumberFormatter.format(numberValue)
    return formattedValue === '-0' ? '0' : formattedValue
  })
}

export function ColorTokenTable() {
  const [colorVariableNames, setColorVariableNames] = createState<string[]>([])

  const colorTokenRows = derive(colorVariableNames, (v) =>
    v.map((cssVariableName) => ({
      name: cssVariableName,
      value: formatColorText(readTokenRawValue(cssVariableName)),
      preview: `var(${cssVariableName}, transparent)`,
    })),
  )

  const refreshColorVariableNames = () => {
    setColorVariableNames(extractColorVariableNamesFromCurrentStylesheet())
  }

  createEffect(refreshColorVariableNames)

  return (
    <Table
      data={colorTokenRows}
      keys={['name', 'preview']}
      renderParts={{
        tableCell: {
          preview: (value) => (
            <Piv
              style={{
                background: `linear-gradient(${String(value)}, ${String(value)}), conic-gradient(#d8dbe1 25%, #ffffff 0 50%, #d8dbe1 0 75%, #ffffff 0)`,
                'background-size': '100% 100%, 16px 16px',
                'min-inline-size': '120px',
                'block-size': '32px',
              }}
            />
          ),
        },
      }}
    />
  )
}
