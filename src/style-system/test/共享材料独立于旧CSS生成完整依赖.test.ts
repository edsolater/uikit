import { expect, test } from 'vitest'
import { compileRules } from '../css-root'
import * as roles from '../pieces/tokens/color/roles'
import { shadow, backdropColor } from '../pieces/tokens/shadow'
import { motionDuration } from '../pieces/tokens/motion'

test('颜色对象、用途阴影和动效的引用均由自身依赖提供', () => {
  const materials = [
    ...Object.values(roles),
    shadow,
    backdropColor,
    motionDuration,
  ]
  const css = compileRules(
    materials.map((material, index) => [
      ['.IndependentMaterials'],
      `--probe-${index}`,
      material,
    ]),
  )
  const declared = new Set(
    [...css.matchAll(/(--[\w-]+)\s*:/g)].map((match) => match[1]),
  )
  const referenced = new Set(
    [...css.matchAll(/var\((--[\w-]+)/g)].map((match) => match[1]),
  )
  expect([...referenced].filter((name) => !declared.has(name))).toEqual([])
  expect(css).toContain('data-theme')
  expect(css).toContain('prefers-reduced-motion: reduce')
  expect(css).not.toMatch(/var\(--shadow-\d/)
  expect(css).not.toContain('--color-adjust(')
  expect(css).not.toContain('--content-on(')
})
