import { ToolbarIconButton } from '@liam-hq/erd-core'
import { MessageCircleIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { type FC, useCallback } from 'react'
import { urlgen } from '../../../../libs/routes'

type Props = {
  projectId: string
  branchOrCommit: string
}

export const CreateDesignSessionButton: FC<Props> = ({
  projectId,
  branchOrCommit,
}) => {
  const router = useRouter()

  const handleClick = useCallback(() => {
    router.push(
      urlgen('projects/[projectId]/ref/[branchOrCommit]/sessions', {
        projectId,
        branchOrCommit,
      }),
    )
  }, [router, projectId, branchOrCommit])

  return (
    <ToolbarIconButton
      onClick={handleClick}
      size="md"
      tooltipContent="Create Design Session"
      label="Create Design Session"
      icon={<MessageCircleIcon />}
    />
  )
}
