-- CreateTable
CREATE TABLE "WatchSchemaMetaFilePattern" (
    "id" SERIAL NOT NULL,
    "pattern" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WatchSchemaMetaFilePattern_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WatchSchemaMetaFilePattern" ADD CONSTRAINT "WatchSchemaMetaFilePattern_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
