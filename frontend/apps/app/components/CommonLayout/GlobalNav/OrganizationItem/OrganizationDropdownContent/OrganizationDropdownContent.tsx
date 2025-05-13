import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from '@/components'
import { setOrganizationIdCookie } from '@/features/organizations/services/setOrganizationIdCookie'
import { Plus } from '@/icons'
import { urlgen } from '@/libs/routes'
import { useRouter } from 'next/navigation'
import { type FC, useCallback } from 'react'
import type { Organization } from '../../../services/getOrganization'
import type { OrganizationsByUserId } from '../../../services/getOrganizationsByUserId'
import styles from './OrganizationDropdownContent.module.css'

type Props = {
  currentOrganization: Organization
  organizations: OrganizationsByUserId
}

export const OrganizationDropdownContent: FC<Props> = ({
  currentOrganization,
  organizations,
}) => {
  const router = useRouter()

  const handleClickCreateOrganization = useCallback(() => {
    router.push(urlgen('organizations/new'))
  }, [router])

  const handleChangeOrganization = useCallback(
    async (organizationId: string) => {
      await setOrganizationIdCookie(organizationId)

      router.refresh()
    },
    [router],
  )

  return (
    <DropdownMenuContent align="start" className={styles.wrapper}>
      <DropdownMenuRadioGroup
        value={currentOrganization.id}
        onValueChange={handleChangeOrganization}
      >
        {organizations.map(({ organizations }) => (
          <DropdownMenuRadioItem
            key={organizations.id}
            value={organizations.id}
            label={organizations.name}
          />
        ))}
      </DropdownMenuRadioGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        leftIcon={<Plus />}
        onClick={handleClickCreateOrganization}
      >
        Create New Organization
      </DropdownMenuItem>
    </DropdownMenuContent>
  )
}
