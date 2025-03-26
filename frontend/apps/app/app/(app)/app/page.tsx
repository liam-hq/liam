import { prisma } from '@liam-hq/db'
import { redirect } from 'next/navigation'

export default async function Page() {
  const projects = await prisma.project.findMany({
    select: {
      id: true,
    },
    take: 1,
  })

  if (projects.length > 0) {
    redirect('/app/projects')
  }

  redirect('/app/projects/new')
}
