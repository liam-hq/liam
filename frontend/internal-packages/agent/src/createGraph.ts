import { END, START, StateGraph } from '@langchain/langgraph'
import {
  analyzeRequirementsNode,
  designSchemaNode,
  prepareDmlNode,
  validateSchemaNode,
} from './chat/workflow/nodes/index.ts'
import { createAnnotations } from './chat/workflow/shared/langGraphUtils.ts'
import { invokeSchemaDesignToolNode } from './db-agent/nodes/invokeSchemaDesignToolNode.ts'
import { routeAfterDesignSchema } from './db-agent/routing/routeAfterDesignSchema.ts'

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
    .addNode('analyzeRequirements', analyzeRequirementsNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('designSchema', designSchemaNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('invokeSchemaDesignTool', invokeSchemaDesignToolNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('prepareDML', prepareDmlNode, {
      retryPolicy: RETRY_POLICY,
    })
    .addNode('validateSchema', validateSchemaNode, {
      retryPolicy: RETRY_POLICY,
    })

    .addEdge(START, 'analyzeRequirements')
    .addEdge('analyzeRequirements', 'designSchema')
    .addEdge('invokeSchemaDesignTool', 'designSchema')
    .addConditionalEdges('designSchema', routeAfterDesignSchema, {
      invokeSchemaDesignTool: 'invokeSchemaDesignTool',
      prepareDML: 'prepareDML',
    })
    .addEdge('prepareDML', 'validateSchema')

    // Conditional edges for validation results
    .addConditionalEdges(
      'validateSchema',
      (state) => {
        // success → END
        // dml error or test fail → designSchema
        return state.error ? 'designSchema' : END
      },
      {
        designSchema: 'designSchema',
        [END]: END,
      },
    )

  return graph.compile()
}
