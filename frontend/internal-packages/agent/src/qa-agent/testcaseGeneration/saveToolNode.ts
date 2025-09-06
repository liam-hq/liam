import { ToolNode } from '@langchain/langgraph/prebuilt'
import { saveTestcaseTool } from '../tools/saveTestcaseTool'

/**
 * Save Tool Node for testcase generation
 * Executes the saveTestcaseTool within the isolated subgraph context
 */
export const saveToolNode = new ToolNode([saveTestcaseTool])
