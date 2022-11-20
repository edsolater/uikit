import { isObject } from '@edsolater/fnkit'
import { createPlugin } from './createPlugin'

export type TooltipPluginOptions = {
  text: string
}
/** used in user's use action */
export const tooltip = createPlugin(
  (...args: [TooltipPluginOptions] | [text: TooltipPluginOptions['text'], options?: TooltipPluginOptions]) => {
    const options = (isObject(args[0]) ? args[0] : { ...args[1], text: args[0] }) as TooltipPluginOptions

    return {
      htmlProps: {
        title: options.text
      }
    }
  }
)
