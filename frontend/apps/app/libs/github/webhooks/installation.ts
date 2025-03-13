import type { GitHubWebhookPayload } from '@/types/github'
import { prisma } from '@liam-hq/db'

export const handleInstallation = async (
  data: GitHubWebhookPayload,
): Promise<{
  success: boolean
  message: string
}> => {
  const action = data.action
  const installationId = data.installation.id

  try {
    switch (action) {
      case 'created': {
        console.error('installation created', data)
        console.error('=========')
        const repositories = data.repositories || []
        if (repositories.length === 0) {
          console.error('length is 0')
          return {
            success: true,
            message: 'No repositories to save',
          }
        }

        const savedRepos = await Promise.all(
          repositories.map(async (repo) => {
            const owner = repo.full_name.split('/')[0]
            const name = repo.full_name.split('/')[1]

            console.error('upserting', owner, name)
            const result = await prisma.repository.upsert({
              where: {
                owner_name: {
                  owner,
                  name,
                },
              },
              update: {
                installationId: BigInt(installationId),
                isActive: true,
              },
              create: {
                owner,
                name,
                installationId: BigInt(installationId),
                isActive: true,
              },
            })
            console.error('result', result)
            return result
          }),
        )

        console.error(`Saved ${savedRepos.length} repositories`)
        return {
          success: true,
          message: `Saved ${savedRepos.length} repositories`,
        }
      }

      case 'deleted': {
        await prisma.repository.updateMany({
          where: {
            installationId: BigInt(installationId),
          },
          data: {
            isActive: false,
          },
        })

        return {
          success: true,
          message: 'Installation deleted and repositories deactivated',
        }
      }

      default:
        throw new Error(`Unsupported installation action: ${action}`)
    }
  } catch (error) {
    console.error(`Error handling installation.${action} event:`, error)
    throw error
  }
}
