// First import Mastra core to ensure it's initialized
import '@mastra/core'
// Then import our Mastra instance
import './mastra'

// Task exports
export {
  savePullRequestTask,
  generateReviewTask,
  saveReviewTask,
  postCommentTask,
} from './mastra/tasks/review'

// Function exports
export { processGenerateReview } from './mastra/tasks/review/generateReview'
export { postComment } from './mastra/tasks/review/postComment'
export { processSavePullRequest } from './mastra/tasks/review/savePullRequest'
export { processSaveReview } from './mastra/tasks/review/saveReview'

// Trigger exports
export {
  helloWorld,
  generateKnowledgeFromFeedbackTask,
  createKnowledgeSuggestionTask,
} from './mastra/trigger/jobs'
