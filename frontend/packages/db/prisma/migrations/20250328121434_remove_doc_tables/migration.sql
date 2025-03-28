/*
  Warnings:

  - You are about to drop the `Doc` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DocVersion` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Doc" DROP CONSTRAINT "Doc_projectId_fkey";

-- DropForeignKey
ALTER TABLE "DocVersion" DROP CONSTRAINT "DocVersion_docId_fkey";

-- DropTable
DROP TABLE "Doc";

-- DropTable
DROP TABLE "DocVersion";
