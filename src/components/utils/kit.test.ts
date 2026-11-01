/** 验证公开定义的类型关联及集合样式身份。 */
import { expect, expectTypeOf, test } from 'vitest'
import type { Source, State } from '@/foundation'
import type { RefReceiver } from '@/hooks/createRef'
import type { ComponentDescriptionProps } from '@/components/ComponentMarker/ComponentMarker'
import {
  Button,
  type ButtonController,
} from '@/components/kits/Button/Button'
import * as buttonStyle from '@/components/kits/Button/Button.style'
import {
  pivPropsDefinition,
  pivDefaultSources,
  componentDescriptionPropsDefinition,
  type PivProps,
} from '@/index'
import { kit } from './kit'
import type { PropsController } from './componentPropsDirector'

const availableProps = {
  description: 'state-source-view',
  descriptionDisplay: 'state-value-view',
  value: 'state-source-view',
  ref: 'only-through-prop',
} as const
interface FixtureProps extends ComponentDescriptionProps {
  value?: Source<string | undefined>
  ref?: RefReceiver<PropsController<FixtureProps, typeof availableProps>>
}
const Fixture = kit(
  { name: 'Fixture', availableProps },
  (_props: FixtureProps) => null,
)

test('集合保留数组与成员方法协议，Button 样式命名空间保留精确原对象', () => {
  expect(Button.controllers.style).toBe(buttonStyle)
  expect(Object.hasOwn(Fixture.controllers, 'style')).toBe(false)
  expectTypeOf(Button.controllers.style).toEqualTypeOf<typeof buttonStyle>()
  expectTypeOf(Button.controllers[0]).toEqualTypeOf<ButtonController>()
  expectTypeOf(Button.controllers.map((controller) => controller)).toEqualTypeOf<
    ButtonController[]
  >()
  expectTypeOf(
    Button.controllers.loading.set(true).map((value) => value),
  ).toEqualTypeOf<State<boolean | undefined>[]>()
})

/** 这些反例保护定义与原 Props、ref 和字段模式的关联，不能只靠运行期断言。 */
function verifyRejectedDefinitions() {
  // @ts-expect-error 无样式定义不公开根 style 命名空间。
  Fixture.controllers.style
  // @ts-expect-error ref 只通过 Props，不能在 Controller 中写入。
  Button.controllers[0].ref.set(() => {})
  kit(
    // @ts-expect-error 错误 ref 接收器不能作为定义的 Props。
    { name: 'WrongRef', availableProps },
    (_props: Omit<FixtureProps, 'ref'> & { ref?: RefReceiver<number> }) => null,
  )
  kit(
    // @ts-expect-error 把 Source 视图交给只接受普通字符串的核心不兼容。
    { name: 'WrongMode', availableProps },
    (_props: Omit<FixtureProps, 'value'> & { value?: string }) => null,
  )
  kit(
    // @ts-expect-error ref 不允许进入 Controller。
    {
      name: 'WritableRef',
      availableProps: { ...availableProps, ref: 'state-value-view' },
    },
    (_props: FixtureProps) => null,
  )
  kit(
    // @ts-expect-error 接收器要求 Controller 没有提供的字段时也必须拒绝。
    { name: 'ExtraRefField', availableProps },
    (
      _props: Omit<FixtureProps, 'ref'> & {
        ref?: RefReceiver<
          PropsController<FixtureProps, typeof availableProps> & {
            missing: string
          }
        >
      },
    ) => null,
  )
}
void verifyRejectedDefinitions

/** 包根调用方可从原拥有者组合完整协议，不需要深导或复制字段表。 */
function verifyPublicDefinition() {
  const availableProps = {
    ...pivPropsDefinition,
    ...componentDescriptionPropsDefinition,
    ref: 'only-through-prop',
  } as const
  interface PublicProps extends PivProps, ComponentDescriptionProps {
    ref?: RefReceiver<PropsController<PublicProps, typeof availableProps>>
  }
  return kit(
    {
      name: 'PublicFixture',
      availableProps,
      directorOptions: () => ({ defaultSources: pivDefaultSources }),
    },
    (_props: PublicProps) => null,
  )
}
void verifyPublicDefinition
