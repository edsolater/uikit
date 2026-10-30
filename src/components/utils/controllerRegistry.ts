/** 保存当前存活的组件控制器，并将明确公开的整体命令转发到各个实例。 */
export function createControllerRegistry<
  Controller,
  Command extends keyof Controller,
>(commands: readonly Command[]) {
  const controllers = new Set<Controller>()
  const all = new Proxy({} as Pick<Controller, Command>, {
    get(target, key, receiver) {
      if (key in target) return Reflect.get(target, key, receiver)
      if (!commands.includes(key as Command)) return undefined
      return (...args: unknown[]) => {
        for (const controller of controllers) {
          Reflect.apply(
            controller[key as Command] as Function,
            controller,
            args,
          )
        }
      }
    },
  })
  return {
    all,
    register(controller: Controller) {
      controllers.add(controller)
      return () => {
        controllers.delete(controller)
      }
    },
  }
}
