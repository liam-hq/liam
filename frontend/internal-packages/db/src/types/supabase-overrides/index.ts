import type { MergeDeep } from 'type-fest'
import type { Database as DatabaseGenerated } from '../../../supabase/database.types'
import type { BuildingSchemasOverride } from './buildingSchemas'
import type { CheckpointBlobsOverride } from './checkpointBlobs'
import type { CheckpointsOverride } from './checkpoints'
import type { CheckpointWritesOverride } from './checkpointWrites'
import type { DesignSessionsOverride } from './designSessions'
import type { ProjectRepositoryMappingsOverride } from './projectRepositoryMappings'
import type { RunEventsOverride } from './runEvents'
import type { RunsOverride } from './runs'
import type { SchemaFilePathsOverride } from './schemaFilePaths'

export type AppDatabaseOverrides = MergeDeep<
  DatabaseGenerated,
  SchemaFilePathsOverride &
    ProjectRepositoryMappingsOverride &
    DesignSessionsOverride &
    BuildingSchemasOverride &
    CheckpointsOverride &
    CheckpointBlobsOverride &
    CheckpointWritesOverride &
    RunsOverride &
    RunEventsOverride
>
