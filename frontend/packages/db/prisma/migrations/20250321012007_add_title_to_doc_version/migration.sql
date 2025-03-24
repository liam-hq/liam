/*
  Warnings:

  - Added the required column `title` to the `DocVersion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DocVersion" ADD COLUMN     "title" TEXT NOT NULL;
