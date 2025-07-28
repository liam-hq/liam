import { BaseCallbackHandler } from '@langchain/core/callbacks/base'
import type { NodeLogger } from './nodeLogger'

export class DebugCallbackHandler extends BaseCallbackHandler {
  name = 'DebugCallbackHandler'
  private stepCount = 0
  private logger: NodeLogger
  private stepStartTimes: Map<number, number> = new Map()
  private currentNode: string | null = null
  private nodeStartTime: number | null = null

  constructor(logger: NodeLogger) {
    super()
    this.logger = logger
  }

  override async handleLLMStart(_llm: any, prompts: string[]): Promise<void> {
    this.stepCount++
    const startTime = Date.now()
    this.stepStartTimes.set(this.stepCount, startTime)

    this.logger.info(
      `🤖 [STEP ${this.stepCount}] LLM Call Started ${this.currentNode ? `(${this.currentNode})` : ''}`,
    )
    this.logger.debug('LLM prompts:', {
      promptCount: prompts.length,
      firstPromptPreview: `${prompts[0]?.substring(0, 100)}...`,
      timestamp: new Date(startTime).toISOString(),
    })
  }

  override async handleLLMEnd(_output: any): Promise<void> {
    const endTime = Date.now()
    const startTime = this.stepStartTimes.get(this.stepCount)
    const duration = startTime ? endTime - startTime : 'unknown'

    this.logger.info(
      `✅ [STEP ${this.stepCount}] LLM Call Completed (${duration}ms)`,
    )
    if (startTime) {
      this.stepStartTimes.delete(this.stepCount)
    }
  }

  override async handleLLMError(err: Error): Promise<void> {
    const endTime = Date.now()
    const startTime = this.stepStartTimes.get(this.stepCount)
    const duration = startTime ? endTime - startTime : 'unknown'

    this.logger.error(
      `❌ [STEP ${this.stepCount}] LLM Error (${duration}ms): ${err.message}`,
    )
    this.logger.error('LLM Error Stack:', { stack: err.stack })
    if (startTime) {
      this.stepStartTimes.delete(this.stepCount)
    }
  }

  override async handleToolStart(tool: any, input: string): Promise<void> {
    this.stepCount++
    const startTime = Date.now()
    this.stepStartTimes.set(this.stepCount, startTime)

    this.logger.info(
      `🔧 [STEP ${this.stepCount}] Tool Started: ${tool.name || 'Unknown'} ${this.currentNode ? `(${this.currentNode})` : ''}`,
    )
    this.logger.debug('Tool input:', {
      toolName: tool.name,
      inputLength: input.length,
      inputPreview: input.substring(0, 200) + (input.length > 200 ? '...' : ''),
      timestamp: new Date(startTime).toISOString(),
    })
  }

  override async handleToolEnd(output: string): Promise<void> {
    const endTime = Date.now()
    const startTime = this.stepStartTimes.get(this.stepCount)
    const duration = startTime ? endTime - startTime : 'unknown'

    this.logger.info(
      `✅ [STEP ${this.stepCount}] Tool Completed (${duration}ms)`,
    )
    this.logger.debug('Tool output:', {
      outputLength: output.length,
      outputPreview:
        output.substring(0, 200) + (output.length > 200 ? '...' : ''),
      duration: `${duration}ms`,
    })
    if (startTime) {
      this.stepStartTimes.delete(this.stepCount)
    }
  }

  override async handleToolError(err: Error): Promise<void> {
    const endTime = Date.now()
    const startTime = this.stepStartTimes.get(this.stepCount)
    const duration = startTime ? endTime - startTime : 'unknown'

    this.logger.error(
      `❌ [STEP ${this.stepCount}] Tool Error (${duration}ms): ${err.message}`,
    )
    this.logger.error('Tool Error Details:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
      duration: `${duration}ms`,
    })
    if (startTime) {
      this.stepStartTimes.delete(this.stepCount)
    }
  }

  override async handleChainStart(chain: any, _inputs: any): Promise<void> {
    this.stepCount++
    const startTime = Date.now()
    this.stepStartTimes.set(this.stepCount, startTime)

    // Track workflow node transitions
    if (chain.id?.includes('node') || this.isWorkflowNode(chain.id)) {
      if (this.currentNode && this.nodeStartTime) {
        const nodeDuration = startTime - this.nodeStartTime
        this.logger.info(
          `⏱️ Node '${this.currentNode}' completed in ${nodeDuration}ms`,
        )
      }
      this.currentNode = chain.id
      this.nodeStartTime = startTime
      this.logger.info(`🎯 [WORKFLOW] Entering node: ${chain.id}`)
    }

    this.logger.info(
      `🔗 [STEP ${this.stepCount}] Chain Started: ${chain.id || 'Unknown'}`,
    )
    this.logger.debug('Chain details:', {
      chainId: chain.id,
      chainType: chain.constructor?.name || 'Unknown',
      timestamp: new Date(startTime).toISOString(),
      isWorkflowNode: this.isWorkflowNode(chain.id),
    })
  }

  override async handleChainEnd(_outputs: any): Promise<void> {
    const endTime = Date.now()
    const startTime = this.stepStartTimes.get(this.stepCount)
    const duration = startTime ? endTime - startTime : 'unknown'

    this.logger.info(
      `✅ [STEP ${this.stepCount}] Chain Completed (${duration}ms)`,
    )
    if (startTime) {
      this.stepStartTimes.delete(this.stepCount)
    }
  }

  override async handleChainError(err: Error): Promise<void> {
    const endTime = Date.now()
    const startTime = this.stepStartTimes.get(this.stepCount)
    const duration = startTime ? endTime - startTime : 'unknown'

    this.logger.error(
      `❌ [STEP ${this.stepCount}] Chain Error (${duration}ms): ${err.message}`,
    )
    this.logger.error('Chain Error Details:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
      currentNode: this.currentNode,
      duration: `${duration}ms`,
    })
    if (startTime) {
      this.stepStartTimes.delete(this.stepCount)
    }
  }

  private isWorkflowNode(chainId: string | undefined): boolean {
    if (!chainId) return false
    const workflowNodes = [
      'webSearch',
      'analyzeRequirements',
      'designSchema',
      'invokeSchemaDesignTool',
      'executeDDL',
      'generateUsecase',
      'prepareDML',
      'validateSchema',
      'finalizeArtifacts',
    ]
    return workflowNodes.some((node) => chainId.includes(node))
  }

  override async handleText(text: string): Promise<void> {
    if (text.trim()) {
      this.logger.debug('Text output:', {
        textLength: text.length,
        textPreview: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        currentNode: this.currentNode,
        timestamp: new Date().toISOString(),
      })
    }
  }

  // Summary method to be called at workflow completion
  public getWorkflowSummary(): void {
    const currentTime = Date.now()
    if (this.currentNode && this.nodeStartTime) {
      const finalNodeDuration = currentTime - this.nodeStartTime
      this.logger.info(
        `⏱️ Final node '${this.currentNode}' completed in ${finalNodeDuration}ms`,
      )
    }

    this.logger.info(
      `📊 [WORKFLOW SUMMARY] Total steps executed: ${this.stepCount}`,
    )
    if (this.stepStartTimes.size > 0) {
      this.logger.warn(
        `⚠️ [WORKFLOW SUMMARY] ${this.stepStartTimes.size} steps still running:`,
        { runningSteps: Array.from(this.stepStartTimes.keys()) },
      )
    }
  }
}
