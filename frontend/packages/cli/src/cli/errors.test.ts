import { describe, expect, it } from 'vitest'
import {
  ArgumentError,
  CliError,
  CriticalError,
  FileSystemError,
  WarningError,
  WarningProcessingError,
} from './errors.js'

describe('Error classes', () => {
  describe('CliError', () => {
    it('should create CliError with correct message and name', () => {
      const error = new CliError('Test CLI error')
      expect(error.message).toBe('Test CLI error')
      expect(error.name).toBe('CliError')
      expect(error).toBeInstanceOf(Error)
    })
  })

  describe('CriticalError', () => {
    it('should create CriticalError with correct message and name', () => {
      const error = new CriticalError('Test critical error')
      expect(error.message).toBe('Test critical error')
      expect(error.name).toBe('CriticalError')
      expect(error).toBeInstanceOf(CliError)
      expect(error).toBeInstanceOf(Error)
    })
  })

  describe('FileSystemError', () => {
    it('should create FileSystemError with correct message and name', () => {
      const error = new FileSystemError('Test filesystem error')
      expect(error.message).toBe('Test filesystem error')
      expect(error.name).toBe('FileSystemError')
      expect(error).toBeInstanceOf(CriticalError)
      expect(error).toBeInstanceOf(CliError)
      expect(error).toBeInstanceOf(Error)
    })
  })

  describe('ArgumentError', () => {
    it('should create ArgumentError with correct message and name', () => {
      const error = new ArgumentError('Test argument error')
      expect(error.message).toBe('Test argument error')
      expect(error.name).toBe('ArgumentError')
      expect(error).toBeInstanceOf(CriticalError)
      expect(error).toBeInstanceOf(CliError)
      expect(error).toBeInstanceOf(Error)
    })
  })

  describe('WarningError', () => {
    it('should create WarningError with correct message and name', () => {
      const error = new WarningError('Test warning error')
      expect(error.message).toBe('Test warning error')
      expect(error.name).toBe('WarningError')
      expect(error).toBeInstanceOf(CliError)
      expect(error).toBeInstanceOf(Error)
    })
  })

  describe('WarningProcessingError', () => {
    it('should create WarningProcessingError with correct message and name', () => {
      const error = new WarningProcessingError('Test warning processing error')
      expect(error.message).toBe('Test warning processing error')
      expect(error.name).toBe('WarningProcessingError')
      expect(error).toBeInstanceOf(WarningError)
      expect(error).toBeInstanceOf(CliError)
      expect(error).toBeInstanceOf(Error)
    })
  })
})
