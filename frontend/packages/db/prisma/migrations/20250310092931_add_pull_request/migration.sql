-- CreateTable
CREATE TABLE "PullRequest" (
    "id" SERIAL NOT NULL,
    "repositoryName" TEXT NOT NULL,
    "repositoryOwner" TEXT NOT NULL,
    "pullNumber" INTEGER NOT NULL,
    "commentId" INTEGER,
    "installationId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PullRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PullRequest_repositoryOwner_repositoryName_pullNumber_key" ON "PullRequest"("repositoryOwner", "repositoryName", "pullNumber");
