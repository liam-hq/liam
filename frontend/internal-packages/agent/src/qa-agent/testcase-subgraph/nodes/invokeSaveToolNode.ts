import { ToolNode } from '@langchain/langgraph/prebuilt'
import { saveTestcasesAndDmlTool } from '../../tools/saveTestcasesAndDmlTool'

/**
 * Invoke Save Tool Node for Subgraph
 * Executes the saveTestcasesAndDmlTool within the isolated subgraph context
 */
export const invokeSaveToolNode = new ToolNode([saveTestcasesAndDmlTool])
