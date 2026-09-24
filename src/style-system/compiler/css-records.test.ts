/** 记录重组必须保留会影响浏览器层叠的声明顺序。 */
import { expect, test } from 'vitest'
import { groupCSSRecords, type CSSRecord } from './css-records'

test('交错的简写与详细属性保持原顺序', () => {
  const records: CSSRecord[] = [
    [['.Probe', '@media (min-width: 0px)'], 'padding', '1px'],
    [['.Probe'], 'padding-left', '2px'],
    [['.Probe', '@media (min-width: 0px)'], 'padding', '3px'],
  ]
  expect(groupCSSRecords(records).map(([, property, content]) => [property, content])).toEqual([
    ['padding', '1px'],
    ['padding-left', '2px'],
    ['padding', '3px'],
  ])
})

test('同名自定义属性跨主体后返回原主体时仍保留覆盖顺序', () => {
  const records: CSSRecord[] = [
    [['.First'], '--shared-color', 'red'],
    [['.Second'], '--shared-color', 'green'],
    [['.First'], '--other-color', 'blue'],
    [['.First'], '--shared-color', 'purple'],
  ]
  expect(groupCSSRecords(records).filter(([, property]) => property === '--shared-color')
    .map(([, property, content]) => [property, content])).toEqual([
    ['--shared-color', 'red'],
    ['--shared-color', 'green'],
    ['--shared-color', 'purple'],
  ])
})
