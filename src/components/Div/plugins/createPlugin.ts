import { DivProps } from '../type';
import { AbilityPlugin } from './type';

export function createPlugin<T extends any[]>(
  createrFn: (...pluginOptions: T) => DivProps | undefined,
  options?: {
    pluginName: string;
  }): (...pluginOptions: T) => AbilityPlugin {
  return (...args) => ({ additionalProps: createrFn(...args) ?? {} });
}
