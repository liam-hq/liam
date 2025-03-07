-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "KnowledgeStatus" AS ENUM ('pending', 'accept');

-- CreateTable
CREATE TABLE "documents" (
    "id" BIGSERIAL NOT NULL,
    "content" TEXT,
    "metadata" JSONB,
    "embedding" vector,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" BIGSERIAL NOT NULL,
    "watchFilePath" TEXT,
    "description" TEXT,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guideline" (
    "id" BIGSERIAL NOT NULL,
    "projectId" BIGINT NOT NULL,
    "title" TEXT,
    "description" TEXT,

    CONSTRAINT "Guideline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" BIGSERIAL NOT NULL,
    "projectId" BIGINT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "occurredAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OverallReview" (
    "id" BIGSERIAL NOT NULL,
    "projectId" BIGINT NOT NULL,
    "reviewComment" TEXT,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pullRequestId" BIGINT,

    CONSTRAINT "OverallReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileReview" (
    "id" BIGSERIAL NOT NULL,
    "overallReviewId" BIGINT NOT NULL,
    "filePath" TEXT,
    "lineStart" INTEGER,
    "lineEnd" INTEGER,
    "reviewComment" TEXT,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pullRequestId" BIGINT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "FileReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OverallReviewComment" (
    "id" BIGSERIAL NOT NULL,
    "overallReviewId" BIGINT NOT NULL,
    "commenterId" BIGINT NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OverallReviewComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileReviewComment" (
    "id" BIGSERIAL NOT NULL,
    "fileReviewId" BIGINT NOT NULL,
    "commenterId" BIGINT NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileReviewComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Knowledge" (
    "id" BIGSERIAL NOT NULL,
    "title" TEXT,
    "content" TEXT,
    "status" "KnowledgeStatus" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" BIGINT,

    CONSTRAINT "Knowledge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rule" (
    "id" BIGSERIAL NOT NULL,
    "projectId" BIGINT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImpactAnalysis" (
    "id" BIGSERIAL NOT NULL,
    "fileReviewId" BIGINT NOT NULL,
    "overallEvaluation" TEXT,
    "overallScore" INTEGER,

    CONSTRAINT "ImpactAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImpactAnalysisEvaluation" (
    "id" BIGSERIAL NOT NULL,
    "impactAnalysisId" BIGINT NOT NULL,
    "evaluationType" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "description" TEXT,

    CONSTRAINT "ImpactAnalysisEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErdGroup" (
    "id" BIGSERIAL NOT NULL,
    "projectId" BIGINT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ErdGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErdGroupItem" (
    "id" BIGSERIAL NOT NULL,
    "erdGroupId" BIGINT NOT NULL,
    "groupableId" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ErdGroupItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErdNote" (
    "id" BIGSERIAL NOT NULL,
    "projectId" BIGINT NOT NULL,
    "content" TEXT NOT NULL,
    "positionX" INTEGER NOT NULL,
    "positionY" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ErdNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PullRequest" (
    "id" BIGSERIAL NOT NULL,
    "projectId" BIGINT NOT NULL,
    "prNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PullRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PRCommit" (
    "id" BIGSERIAL NOT NULL,
    "pullRequestId" BIGINT NOT NULL,
    "commitHash" TEXT NOT NULL,
    "committedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PRCommit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ImpactAnalysis_fileReviewId_key" ON "ImpactAnalysis"("fileReviewId");

-- AddForeignKey
ALTER TABLE "Guideline" ADD CONSTRAINT "Guideline_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OverallReview" ADD CONSTRAINT "OverallReview_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OverallReview" ADD CONSTRAINT "OverallReview_pullRequestId_fkey" FOREIGN KEY ("pullRequestId") REFERENCES "PullRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileReview" ADD CONSTRAINT "FileReview_overallReviewId_fkey" FOREIGN KEY ("overallReviewId") REFERENCES "OverallReview"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileReview" ADD CONSTRAINT "FileReview_pullRequestId_fkey" FOREIGN KEY ("pullRequestId") REFERENCES "PullRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OverallReviewComment" ADD CONSTRAINT "OverallReviewComment_overallReviewId_fkey" FOREIGN KEY ("overallReviewId") REFERENCES "OverallReview"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileReviewComment" ADD CONSTRAINT "FileReviewComment_fileReviewId_fkey" FOREIGN KEY ("fileReviewId") REFERENCES "FileReview"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Knowledge" ADD CONSTRAINT "Knowledge_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rule" ADD CONSTRAINT "Rule_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpactAnalysis" ADD CONSTRAINT "ImpactAnalysis_fileReviewId_fkey" FOREIGN KEY ("fileReviewId") REFERENCES "FileReview"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpactAnalysisEvaluation" ADD CONSTRAINT "ImpactAnalysisEvaluation_impactAnalysisId_fkey" FOREIGN KEY ("impactAnalysisId") REFERENCES "ImpactAnalysis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErdGroup" ADD CONSTRAINT "ErdGroup_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErdGroupItem" ADD CONSTRAINT "ErdGroupItem_erdGroupId_fkey" FOREIGN KEY ("erdGroupId") REFERENCES "ErdGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErdNote" ADD CONSTRAINT "ErdNote_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PullRequest" ADD CONSTRAINT "PullRequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PRCommit" ADD CONSTRAINT "PRCommit_pullRequestId_fkey" FOREIGN KEY ("pullRequestId") REFERENCES "PullRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
