-- CreateTable
CREATE TABLE "SchemaMeta" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "content" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "SchemaMeta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SchemaMeta_projectId_key" ON "SchemaMeta"("projectId");

-- AddForeignKey
ALTER TABLE "SchemaMeta" ADD CONSTRAINT "SchemaMeta_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
