// First import Mastra core to ensure it's initialized
import '@mastra/core'
// Then import our Mastra instance
import './mastra'

export {
  savePullRequestTask,
  generateReviewTask,
  saveReviewTask,
  postCommentTask,
} from './mastra/tasks/review'
export {
  helloWorld,
  generateKnowledgeFromFeedbackTask,
} from './mastra/trigger/jobs'
