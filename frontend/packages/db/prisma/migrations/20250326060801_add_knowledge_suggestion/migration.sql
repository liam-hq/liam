-- CreateEnum
CREATE TYPE "KnowledgeType" AS ENUM ('SCHEMA', 'DOCS');

-- CreateTable
CREATE TABLE "KnowledgeSuggestion" (
    "id" SERIAL NOT NULL,
    "type" "KnowledgeType" NOT NULL,
    "title" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "fileSha" TEXT NOT NULL,
    "projectId" INTEGER NOT NULL,
    "overallReviewId" INTEGER,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeSuggestion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "KnowledgeSuggestion" ADD CONSTRAINT "KnowledgeSuggestion_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeSuggestion" ADD CONSTRAINT "KnowledgeSuggestion_overallReviewId_fkey" FOREIGN KEY ("overallReviewId") REFERENCES "OverallReview"("id") ON DELETE SET NULL ON UPDATE CASCADE;
