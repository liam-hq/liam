'use client'

import { Button } from '@liam-hq/ui'
import type { FC } from 'react'
import { useEffect, useState } from 'react'
import styles from './ChatQuestionOptions.module.css'

interface ChatQuestionOptionsProps {
  content: string
  onOptionSelect: (option: string) => void
}

export const ChatQuestionOptions: FC<ChatQuestionOptionsProps> = ({
  content,
  onOptionSelect,
}) => {
  const [question, setQuestion] = useState<string | null>(null)
  const [options, setOptions] = useState<string[]>([])

  useEffect(() => {
    // Parse the content to extract questions and options
    // First try the explicit question format
    const questionMatch = content.match(/```question\s*([\s\S]*?)```/)

    // Find all options blocks with more flexible matching
    const optionsMatches = Array.from(
      content.matchAll(/```options\s*([\s\S]*?)```/g),
    )

    // If we have an explicit question, use it
    if (questionMatch?.[1]) {
      setQuestion(questionMatch[1].trim())
    } else if (optionsMatches.length > 0) {
      // If no explicit question but we have options, try to extract a question from the text
      // Look for text ending with a question mark before the first options block
      const firstOptionsIndex = content.indexOf('```options')
      if (firstOptionsIndex > 0) {
        const textBeforeOptions = content.substring(0, firstOptionsIndex).trim()

        // Find the last sentence ending with a question mark
        const questionSentences = textBeforeOptions.match(/[^.!?]*\?/g)
        if (questionSentences && questionSentences.length > 0) {
          const lastQuestion =
            questionSentences[questionSentences.length - 1].trim()
          setQuestion(lastQuestion)
        } else {
          // If no question mark, use the heading or text before options
          const headingMatch = textBeforeOptions.match(
            /#{1,6}\s*(.*?)(?:\r?\n|$)/m,
          )
          if (headingMatch?.[1]) {
            setQuestion(headingMatch[1])
          } else {
            // Use the last paragraph before options
            const paragraphs = textBeforeOptions.split('\n\n')
            const lastParagraph = paragraphs[paragraphs.length - 1].trim()
            setQuestion(lastParagraph)
          }
        }
      }
    } else {
      setQuestion(null)
    }

    // Process options blocks
    if (optionsMatches.length > 0) {
      // Use the first options block by default
      let selectedOptionsMatch = optionsMatches[0]

      // If there are multiple options blocks, try to find one that's associated with the question
      if (optionsMatches.length > 1 && question) {
        // Find the options block that appears closest after the question in the content
        const questionIndex = content.indexOf(question)
        if (questionIndex >= 0) {
          let closestOptionsMatch = optionsMatches[0]
          let closestDistance = Number.MAX_SAFE_INTEGER

          for (const match of optionsMatches) {
            const matchIndex = content.indexOf(match[0])
            if (
              matchIndex > questionIndex &&
              matchIndex - questionIndex < closestDistance
            ) {
              closestOptionsMatch = match
              closestDistance = matchIndex - questionIndex
            }
          }

          selectedOptionsMatch = closestOptionsMatch
        }
      }

      if (selectedOptionsMatch?.[1]) {
        const optionsList = selectedOptionsMatch[1]
          .trim()
          .split('\n')
          .map((option) => option.trim())
          .filter((option) => option.length > 0)
        setOptions(optionsList)
      } else {
        setOptions([])
      }
    } else {
      setOptions([])
    }
  }, [content, question])

  // If no options were found, don't render anything
  if (options.length === 0) {
    return null
  }

  return (
    <div className={styles.questionContainer}>
      {options.length > 0 ? (
        <div className={styles.optionsContainer}>
          {options.map((option) => (
            <Button
              key={`option-${option}`}
              onClick={() => onOptionSelect(option)}
              className={styles.optionButton}
            >
              {option}
            </Button>
          ))}
        </div>
      ) : (
        <div className={styles.optionsContainer}>
          <Button
            onClick={() => {
              // For free-form questions (without options), we'll prompt the user to type their answer
              onOptionSelect('I will type my answer')
            }}
            className={styles.optionButton}
          >
            Respond to this question
          </Button>
        </div>
      )}
    </div>
  )
}
