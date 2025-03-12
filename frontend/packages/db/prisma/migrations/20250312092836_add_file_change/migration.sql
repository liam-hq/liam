-- CreateTable
CREATE TABLE "FileChange" (
    "id" SERIAL NOT NULL,
    "pullRequestId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FileChange_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FileChange" ADD CONSTRAINT "FileChange_pullRequestId_fkey" FOREIGN KEY ("pullRequestId") REFERENCES "PullRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
