'use server'

import { prisma } from '@liam-hq/db'

export const addProject = async (formData: FormData) => {
  const projectName = formData.get('projectName') as string
  await prisma.project.create({
    data: {
      name: projectName,
    },
  })
}
