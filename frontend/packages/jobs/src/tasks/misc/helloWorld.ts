import { logger, task } from '@trigger.dev/sdk/v3'

export type HelloWorldPayload = {
  name: string
}

export const helloWorldTask = task({
  id: 'helloworld',
  run: async (payload: HelloWorldPayload) => {
    logger.log('Executing Hello World task:', { payload })
    return `Hello ${payload.name}`
  },
})

export const helloWorld = async (name?: string) => {
  await helloWorldTask.trigger({ name: name ?? 'World' })
}
