/*
  Warnings:

  - Added the required column `branchName` to the `KnowledgeSuggestion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "KnowledgeSuggestion" ADD COLUMN     "branchName" TEXT NOT NULL;
