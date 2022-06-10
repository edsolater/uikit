import { flapDeep, isArray, isString, MayDeepArray, shakeNil, toKebabCase, uncapitalize } from '@edsolater/fnkit'

export type DivDataTag = {
  key: string
  value?: string
}

export function toDataset(...tags: MayDeepArray<DivDataTag | undefined>[]): Record<string, any> | undefined {
  if (tags.every((t) => t == null) || flapDeep(tags).every((t) => t == null)) return
  return shakeNil(
    Object.fromEntries(shakeNil(flapDeep([tags])).map((tag) => [`data-${toKebabCase(tag.key)}`, tag.value]))
  )
}

export function createDataTag(pair: [key: string, value?: boolean | number | string]): DivDataTag
export function createDataTag(key: string, value?: boolean | number | string): DivDataTag
export function createDataTag(config: { key: string; value?: boolean | number | string }): DivDataTag
export function createDataTag(...params) {
  if (isString(params[0])) {
    return {
      key: uncapitalize(params[0]),
      value: toString(params[1] ?? true)
    }
  } else if (isArray(params[0])) {
    return {
      key: uncapitalize(params[0][0]),
      value: toString(params[0][1] ?? true)
    }
  } else {
    return {
      key: uncapitalize(params[0].key),
      value: toString(params[0].value ?? true)
    }
  }
}

function toString(v?: unknown | undefined): string | undefined {
  return v == null ? undefined : String(v)
}

export function hasTag(el: HTMLElement, tag: DivDataTag): boolean {
  return tag.value ? el.dataset[tag.key] === tag.value : Boolean(el.dataset[tag.key])
}
