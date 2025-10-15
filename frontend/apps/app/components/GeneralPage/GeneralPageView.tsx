import { GeneralPageClient } from './components/GeneralPageClient'

type Props = {
  organization: {
    id: string
    name: string
  }
}

export const GeneralPageView = ({ organization }: Props) => {
  return <GeneralPageClient organization={organization} />
}
