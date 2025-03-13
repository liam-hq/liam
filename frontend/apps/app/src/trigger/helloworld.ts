import { logger, task } from '@trigger.dev/sdk/v3'

export const helloWorldTask = task({
  id: 'helloworld',
  run: async (payload: { name: string }) => {
    logger.log('Executing Hello World task:', { payload })
    return `Hello ${payload.name}`
  },
})
