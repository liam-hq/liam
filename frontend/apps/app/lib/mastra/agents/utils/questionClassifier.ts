/**
 * Classifies a user question as either an "Ask" or "Build" type question
 * for database schema-related queries.
 *
 * - "Ask" questions are about explaining, understanding, or querying existing schemas
 * - "Build" questions are about designing, creating, or optimizing schemas
 *
 * @param question The user's question text
 * @returns 'ask' or 'build' based on the classification
 */
type QuestionType = 'ask' | 'build'

export function classifyQuestion(question: string): QuestionType {
  const normalizedQuestion = question.toLowerCase().trim()

  // Keywords that indicate a "Build" question
  const buildKeywords = [
    'design',
    'create',
    'build',
    'optimize',
    'improve',
    'suggest',
    'recommend',
    'implement',
    'structure',
    'architect',
    'best practice',
    'best way',
    'how should i',
    'how would you',
    'what is the best',
    'how to design',
    'how to structure',
    'how to implement',
    'how to model',
    'how to represent',
    'how to organize',
  ]

  // Check if the question contains any build keywords
  for (const keyword of buildKeywords) {
    if (normalizedQuestion.includes(keyword)) {
      return 'build'
    }
  }

  // Default to "Ask" if no build keywords are found
  return 'ask'
}
