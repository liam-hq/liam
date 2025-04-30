'use client'

import { type Schema, schemaSchema } from '@liam-hq/db-structure'
import { parse } from 'valibot'

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

  try {
    const parsedErdContent = parse(schemaSchema, JSON.parse(erdContent))
    return {
      hasERD: true,
      normalContent: content,
      schema: parsedErdContent,
    }
  } catch {
    return { hasERD: false, normalContent: content, schema: null }
  }
}
