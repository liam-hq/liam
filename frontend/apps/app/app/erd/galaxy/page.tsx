import type { FC } from 'react'

const Page: FC = () => {
  if (process.env.NEXT_PUBLIC_ENV_NAME === 'production') return null

  return (
    <div>
      <p>Galaxy page</p>
    </div>
  )
}

export default Page
