import { END, START, StateGraph } from '@langchain/langgraph'
import {
  analyzeRequirementsNode,
  designSchemaNode,
  executeDdlNode,
  finalizeArtifactsNode,
  generateUsecaseNode,
  prepareDmlNode,
  validateSchemaNode,
  webSearchNode,
} from './chat/workflow/nodes'
import { createAnnotations } from './chat/workflow/shared/langGraphUtils'
import { invokeSchemaDesignToolNode } from './db-agent/nodes/invokeSchemaDesignToolNode'
import { routeAfterDesignSchema } from './db-agent/routing/routeAfterDesignSchema'

/**
 * Retry policy configuration for all nodes
 */
const RETRY_POLICY = {
  maxAttempts: process.env['NODE_ENV'] === 'test' ? 1 : 3,
}

/**
 * Create and configure the LangGraph workflow
 */
export const createGraph = () => {
  const ChatStateAnnotation = createAnnotations()
  const graph = new StateGraph(ChatStateAnnotation)

  graph
    .addNode('webSearch', webSearchNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('analyzeRequirements', analyzeRequirementsNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('designSchema', designSchemaNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('invokeSchemaDesignTool', invokeSchemaDesignToolNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('executeDDL', executeDdlNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('generateUsecase', generateUsecaseNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('prepareDML', prepareDmlNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('validateSchema', validateSchemaNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('finalizeArtifacts', finalizeArtifactsNode, {
      retryPolicy: RETRY_POLICY,
    })

    .addEdge(START, 'webSearch')
    .addEdge('webSearch', 'analyzeRequirements')
    .addEdge('analyzeRequirements', 'designSchema')
    .addEdge('invokeSchemaDesignTool', 'designSchema')
    .addConditionalEdges('designSchema', routeAfterDesignSchema, {
      invokeSchemaDesignTool: 'invokeSchemaDesignTool',
      executeDDL: 'executeDDL',
    })
    .addEdge('executeDDL', 'generateUsecase')
    .addEdge('generateUsecase', 'prepareDML')
    .addEdge('prepareDML', 'validateSchema')
    .addEdge('finalizeArtifacts', END)

    // Conditional edge for executeDDL - retry with designSchema if DDL execution fails
    .addConditionalEdges(
      'executeDDL',
      (state) => {
        if (state.shouldRetryWithDesignSchema) {
          return 'designSchema'
        }
        if (state.ddlExecutionFailed) {
          return 'finalizeArtifacts'
        }
        return 'generateUsecase'
      },
      {
        designSchema: 'designSchema',
        finalizeArtifacts: 'finalizeArtifacts',
        generateUsecase: 'generateUsecase',
      },
    )

    // Conditional edges for validation results
    .addConditionalEdges(
      'validateSchema',
      (state) => {
        // success → finalizeArtifacts
        // dml error or test fail → designSchema
        return state.error ? 'designSchema' : 'finalizeArtifacts'
      },
      {
        designSchema: 'designSchema',
        finalizeArtifacts: 'finalizeArtifacts',
      },
    )

  return graph.compile()
}
