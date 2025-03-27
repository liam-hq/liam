import { prisma } from '@liam-hq/db'

export const getInstallationIdFromRepositoryId = async (
  repositoryId: number,
): Promise<number> => {
  const repository = await prisma.repository.findUnique({
    where: {
      id: repositoryId,
    },
    select: {
      installationId: true,
    },
  })

  if (!repository) {
    throw new Error(`Repository with ID ${repositoryId} not found`)
  }

  return Number(repository.installationId)
}
