import { Command } from 'commander'
import { bold, green } from 'yoctocolors'

const initCommand = new Command('init').description(
  'guide you interactively through the setup',
)

initCommand.action(() => {
  console.info(
    green(
      bold(`
    👾  Welcome to the @liam-hq/cli setup process! 👾

    This \`init\` subcommand will guide you interactively through the setup.
    `),
    ),
  )
})

export { initCommand }
