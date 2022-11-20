import { isString } from '@edsolater/fnkit'
import { Tooltip } from '../../Tooltip'
import { DivChildNode } from '../type'
import { createWrapperPlugin } from './createPlugin'

export type WrapTooltipPluginOptions = {
  content: DivChildNode
}

export const WrapTooltip = createWrapperPlugin(
  (...args: [WrapTooltipPluginOptions] | [content: WrapTooltipPluginOptions['content'], options?: WrapTooltipPluginOptions]) => {
    const options = (isString(args[0]) ? { ...args[1], content: args[0] } : args[0]) as WrapTooltipPluginOptions
    return (node) => <Tooltip renderButton={() => node} renderTooltipContent={options.content} />
  }
)
