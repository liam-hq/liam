import { describe, expect, it, vi } from 'vitest'
import { CriticalError, WarningError } from './errors.js'
import { actionRunner } from './actionRunner.js'

describe('actionRunner', () => {
  describe('actionErrorHandler', () => {
    it('should handle CriticalError and log to console.error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called')
      })
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})

      const mockFn = vi.fn().mockResolvedValue([new CriticalError('Test critical error')])
      const runner = actionRunner(mockFn)

      await expect(runner('test-args')).rejects.toThrow('process.exit called')

      expect(consoleSpy).toHaveBeenCalledWith('\u001b[31mERROR: Test critical error\u001b[39m')
      expect(consoleInfoSpy).toHaveBeenCalledWith('For more information, see https://liambx.com/docs/parser/troubleshooting')
      expect(processExitSpy).toHaveBeenCalledWith(1)

      consoleSpy.mockRestore()
      processExitSpy.mockRestore()
      consoleInfoSpy.mockRestore()
    })

    it('should handle WarningError and log to console.warn', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called')
      })
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})

      const mockFn = vi.fn().mockResolvedValue([new WarningError('Test warning error')])
      const runner = actionRunner(mockFn)

      await expect(runner('test-args')).rejects.toThrow('process.exit called')

      expect(consoleWarnSpy).toHaveBeenCalledWith('\u001b[33mWARN: Test warning error\u001b[39m')
      expect(consoleInfoSpy).toHaveBeenCalledWith('For more information, see https://liambx.com/docs/parser/troubleshooting')
      expect(processExitSpy).toHaveBeenCalledWith(1)

      consoleWarnSpy.mockRestore()
      processExitSpy.mockRestore()
      consoleInfoSpy.mockRestore()
    })

    it('should handle generic Error without logging', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called')
      })
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})

      const mockFn = vi.fn().mockResolvedValue([new Error('Generic error')])
      const runner = actionRunner(mockFn)

      await expect(runner('test-args')).rejects.toThrow('process.exit called')

      expect(consoleSpy).not.toHaveBeenCalled()
      expect(consoleWarnSpy).not.toHaveBeenCalled()
      expect(consoleInfoSpy).toHaveBeenCalledWith('For more information, see https://liambx.com/docs/parser/troubleshooting')
      expect(processExitSpy).toHaveBeenCalledWith(1)

      consoleSpy.mockRestore()
      consoleWarnSpy.mockRestore()
      processExitSpy.mockRestore()
      consoleInfoSpy.mockRestore()
    })

    it('should complete successfully when no errors are returned', async () => {
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called')
      })

      const mockFn = vi.fn().mockResolvedValue([])
      const runner = actionRunner(mockFn)

      await runner('test-args')

      expect(mockFn).toHaveBeenCalledWith('test-args')
      expect(processExitSpy).not.toHaveBeenCalled()

      processExitSpy.mockRestore()
    })

    it('should handle multiple errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called')
      })
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})

      const mockFn = vi.fn().mockResolvedValue([
        new CriticalError('Critical error'),
        new WarningError('Warning error'),
        new Error('Generic error'),
      ])
      const runner = actionRunner(mockFn)

      await expect(runner('test-args')).rejects.toThrow('process.exit called')

      expect(consoleSpy).toHaveBeenCalledWith('\u001b[31mERROR: Critical error\u001b[39m')
      expect(consoleWarnSpy).toHaveBeenCalledWith('\u001b[33mWARN: Warning error\u001b[39m')
      expect(consoleInfoSpy).toHaveBeenCalledWith('For more information, see https://liambx.com/docs/parser/troubleshooting')
      expect(processExitSpy).toHaveBeenCalledWith(1)

      consoleSpy.mockRestore()
      consoleWarnSpy.mockRestore()
      processExitSpy.mockRestore()
      consoleInfoSpy.mockRestore()
    })
  })
})
