/**
 * UIKit 的 Storybook 运行入口。
 *
 * 负责发现组件示例并接入统一源码路径映射，保留框架提供的构建配置。
 *
 * 让组件示例与组件库使用同一套源码引用路径。
 */
import type { StorybookConfig } from 'storybook-solidjs-vite'
import { mergeConfig } from 'vite'
import { sourceAlias } from '../vite.shared.ts'

const config: StorybookConfig = {
  framework: 'storybook-solidjs-vite',
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [],
  /**
   * 为 Storybook 合并源码别名，保留框架已经配置的插件和解析规则。
   */
  viteFinal(config) {
    return mergeConfig(config, { resolve: { alias: sourceAlias } })
  },
}

export default config
