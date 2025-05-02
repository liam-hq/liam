'use client'

import { type Schema, schemaSchema } from '@liam-hq/db-structure'
import { safeParse } from 'valibot'

interface ParseERDResult {
  hasERD: boolean
  normalContent: string
  schema: Schema | null
}

export const parseERDFromMarkdown = (content: string): ParseERDResult => {
  const erdRegex = /```erd\n([\s\S]*?)```/g

  const match = content.match(erdRegex)

  if (!match) {
    return { hasERD: false, normalContent: content, schema: null }
  }

  const erdBlock = match[0]
  const erdContent = erdBlock.replace(/```erd\n/, '').replace(/```$/, '')

  console.log(safeParse(schemaSchema, JSON.parse(erdContent)))

  // const parsedErdContent = safeParse(schemaSchema, JSON.parse(erdContent))

  // if (!parsedErdContent.success) {
  //   return { hasERD: false, normalContent: content, schema: null }
  // }

  return {
    hasERD: true,
    normalContent: content,
    schema: JSON.parse(erdContent),
  }
}
