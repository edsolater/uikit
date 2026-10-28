/** 为 token 预设名称前缀和根据地，逐项配置覆盖共性。 */
import { token, type TokenAddress, type TokenData } from '../core'
import { allocateVariableName } from '../../custom-property-names'

export function createNewTokenGenerator(config: {
  prefixName: string
  address: TokenAddress
}): typeof token {
  return ((
    input: Parameters<typeof token>[0],
    options?: Parameters<typeof token>[1],
  ) =>
    token<TokenData>(input, {
      name: allocateVariableName(undefined, undefined, config.prefixName),
      address: config.address,
      ...(typeof options === 'string' ? { name: options } : options),
    })) as typeof token
}
