/**
 * 这个文件只负责 ColorDashboard 的颜色列表展示。
 * 它负责扫描当前页面的颜色 CSS 变量名，并整理成颜色 token 表格行。
 */
import { onMount } from 'solid-js'
import { Piv } from '../../components/Piv'
import { Table } from '../../components/kits'
import { createState } from '../../hooks'

const colorNumberFormatter = new Intl.NumberFormat('en-US', {
  maximumSignificantDigits: 3,
  useGrouping: false,
})

/**
 * 判断当前规则是否直接承载了一组样式声明。
 */
function hasStyleDeclaration(rule: CSSRule): rule is CSSRule & { style: CSSStyleDeclaration } {
  return 'style' in rule
}

/**
 * 从一组样式声明里提取 --color-* 变量名。
 */
function collectColorVariableNamesFromStyleDeclaration(style: CSSStyleDeclaration, cssVariableNames: Set<string>) {
  for (let propertyIndex = 0; propertyIndex < style.length; propertyIndex += 1) {
    const name = style.item(propertyIndex)
    if (isCSSVariable(name)) {
      cssVariableNames.add(name)
    }
  }
}

/**
 * 判断当前规则是否还能继续向下读取子规则。
 */
function hasNestedCssRules(rule: CSSRule): rule is CSSRule & { cssRules: CSSRuleList } {
  return 'cssRules' in rule
}

/**
 * 递归扫描样式规则，找出任意规则里声明的 --color-* 变量名。
 */
function collectColorVariableNamesFromStylesheetRules(cssRules: CSSRuleList, cssVariableNames: Set<string>) {
  for (const rule of Array.from(cssRules)) {
    try {
      if (hasStyleDeclaration(rule)) {
        collectColorVariableNamesFromStyleDeclaration(rule.style, cssVariableNames)
      }

      if (hasNestedCssRules(rule)) {
        collectColorVariableNamesFromStylesheetRules(rule.cssRules, cssVariableNames)
      }
    } catch (error) {
      console.log('Skip CSS rule while collecting color variables:', rule, error)
    }
  }
}

function isCSSVariable(name: string) {
  return name.startsWith('--color-')
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
 * 把 CSS 变量解析成浏览器最终能绘制的颜色。
 * preview 只关心“当前主题下能不能画出来”，原始声明继续交给 value 列展示。
 */
function readTokenResolvedColorValue(token: string) {
  const element = document.createElement('div')
  element.style.setProperty('background-color', `var(${token}, transparent)`)
  document.body.append(element)

  const resolvedValue = getComputedStyle(element).backgroundColor
  element.remove()

  return resolvedValue || 'transparent'
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

export function ColorCSSTokenTable() {
  const colorVariableNames = createState<string[]>([])

  const colorTokenRows = colorVariableNames.map((cssVariableNames: string[]) =>
    cssVariableNames.map((cssVariableName) => ({
      name: cssVariableName,
      value: formatColorText(readTokenRawValue(cssVariableName)),
      preview: readTokenResolvedColorValue(cssVariableName),
    })),
  )

  const refreshColorVariableNames = () => {
    colorVariableNames.set(extractColorVariableNamesFromCurrentStylesheet())
  }

  onMount(refreshColorVariableNames)

  return (
    <Table
      data={colorTokenRows}
      keys={['name', 'value', 'preview']}
      renderParts={{
        tableCell: {
          preview: (value) => (
            <Piv
              style={{
                'background-image': `linear-gradient(${String(value)}, ${String(value)}), conic-gradient(#d8dbe1 25%, #ffffff 0 50%, #d8dbe1 0 75%, #ffffff 0)`,
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
