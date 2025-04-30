import { ERDEditor } from '@/features/schemas/pages/SchemaPage/components/ERDEditor'
import { sampleSchema } from './schema'

export default function Page() {
  return (
    <ERDEditor
      schema={sampleSchema}
      errorObjects={undefined}
      defaultSidebarOpen={false}
    />
  )
}
