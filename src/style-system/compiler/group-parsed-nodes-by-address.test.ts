/** parsed 节点的保守分组必须保留会影响浏览器层叠的声明顺序。 */
import { expect, test } from 'vitest'
import { condition } from '../condition'
import { groupParsedNodesByAddress } from './group-parsed-nodes-by-address'
import type { ParsedStyleNode } from './style-nodes'

test('交错的简写与详细属性保持原顺序', () => {
  const nodes: ParsedStyleNode[] = [
    { conditionPath: [condition('.Probe'), condition('@media (min-width: 0px)')], key: 'padding', value: '1px' },
    { conditionPath: [condition('.Probe')], key: 'padding-left', value: '2px' },
    { conditionPath: [condition('.Probe'), condition('@media (min-width: 0px)')], key: 'padding', value: '3px' },
  ]
  expect(groupParsedNodesByAddress(nodes).map(({ key, value }) => [key, value])).toEqual([
    ['padding', '1px'],
    ['padding-left', '2px'],
    ['padding', '3px'],
  ])
})

test('同名自定义属性跨主体后返回原主体时仍保留覆盖顺序', () => {
  const nodes: ParsedStyleNode[] = [
    { conditionPath: [condition('.First')], key: '--shared-color', value: 'red' },
    { conditionPath: [condition('.Second')], key: '--shared-color', value: 'green' },
    { conditionPath: [condition('.First')], key: '--other-color', value: 'blue' },
    { conditionPath: [condition('.First')], key: '--shared-color', value: 'purple' },
  ]
  expect(groupParsedNodesByAddress(nodes).filter(({ key }) => key === '--shared-color')
    .map(({ key, value }) => [key, value])).toEqual([
    ['--shared-color', 'red'],
    ['--shared-color', 'green'],
    ['--shared-color', 'purple'],
  ])
})
