import { ToolNode } from '@langchain/langgraph/prebuilt'
import { saveTestcasesAndDmlTool } from '../tools/saveTestcasesAndDmlTool'

/**
 * Save Tool Node for testcase generation
 * Executes the saveTestcasesAndDmlTool within the isolated subgraph context
 */
export const saveToolNode = new ToolNode([saveTestcasesAndDmlTool])
