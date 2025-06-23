import { describe, expect, it } from 'vitest'
import type { Schemas } from './evaluate'
import { evaluate } from './evaluate'

// Increase timeout due to model initialization
const TIMEOUT = 30000

describe('evaluate', () => {
  it(
    'simple case: full match',
    async () => {
      const reference: Schemas = {
        User: {
          Attributes: ['id', 'name'],
          'Primary key': ['id'],
        },
        Post: {
          Attributes: ['id', 'user_id', 'content'],
          'Primary key': ['id'],
          'Foreign key': { user_id: { ref: 'User', key: 'id' } },
        },
      }
      const predict: Schemas = {
        User: {
          Attributes: ['id', 'name'],
          'Primary key': ['id'],
        },
        Post: {
          Attributes: ['id', 'user_id', 'content'],
          'Primary key': ['id'],
          'Foreign key': { user_id: { ref: 'User', key: 'id' } },
        },
      }

      const result = await evaluate(reference, predict)

      expect(result.schemaF1).toBe(1)
      expect(result.schemaAllcorrect).toBe(1)
      expect(result.attributeF1Avg).toBeCloseTo(1)
      expect(result.primaryKeyAvg).toBeCloseTo(1)
      expect(result.foreignKeyAvg).toBeCloseTo(1)
      expect(result.schemaAllcorrectFull).toBe(1)
    },
    TIMEOUT,
  )

  it(
    'partial match: missing one schema',
    async () => {
      const reference: Schemas = {
        User: {
          Attributes: ['id', 'name'],
          'Primary key': ['id'],
        },
        Post: {
          Attributes: ['id', 'user_id', 'content'],
          'Primary key': ['id'],
          'Foreign key': { user_id: { ref: 'User', key: 'id' } },
        },
      }
      const predict: Schemas = {
        User: {
          Attributes: ['id', 'name'],
          'Primary key': ['id'],
        },
      }

      const result = await evaluate(reference, predict)

      expect(result.schemaF1).toBeLessThan(1)
      expect(result.schemaAllcorrect).toBe(0)
      expect(result.attributeF1Avg).toBeLessThan(1)
      expect(result.primaryKeyAvg).toBeLessThan(1)
      expect(result.foreignKeyAvg).toBeLessThan(1)
      expect(result.schemaAllcorrectFull).toBe(0)
    },
    TIMEOUT,
  )

  it(
    'attribute mismatch',
    async () => {
      const reference: Schemas = {
        User: {
          Attributes: ['id', 'name', 'email'],
          'Primary key': ['id'],
        },
      }
      const predict: Schemas = {
        User: {
          Attributes: ['id', 'username'],
          'Primary key': ['id'],
        },
      }

      const result = await evaluate(reference, predict)

      expect(result.attributeF1Avg).toBeLessThan(1)
      expect(result.attributeAllcorrectAvg).toBe(0)
      expect(result.schemaF1).toBe(1)
      expect(result.schemaAllcorrectFull).toBe(0)
    },
    TIMEOUT,
  )

  // larger test cases
  it(
    'insurance company (real-world partial match case)',
    async () => {
      // --- reference
      const reference: Schemas = {
        'Insurance Agent': {
          Attributes: ['Agent ID', 'Name', 'Hire Date', 'Contact Phone'],
          'Primary key': ['Agent ID'],
          'Foreign key': {},
        },
        Customer: {
          Attributes: [
            'Customer ID',
            'Name',
            'ID Card Number',
            'Contact Phone',
          ],
          'Primary key': ['Customer ID'],
          'Foreign key': {},
        },
        'Insurance Policy': {
          Attributes: [
            'Policy ID',
            'Agent ID',
            'Customer ID',
            'Insurance Type',
            'Insured Amount',
            'Insurance Term',
            'Premium',
          ],
          'Primary key': ['Policy ID'],
          'Foreign key': {
            'Agent ID': { 'Insurance Agent': 'Agent ID' },
            'Customer ID': { Customer: 'Customer ID' },
          },
        },
        'Payment Record': {
          Attributes: [
            'Policy ID',
            'Payment Amount',
            'Payment Date',
            'Payment Method',
          ],
          'Primary key': ['Policy ID'],
          'Foreign key': { 'Policy ID': { 'Insurance Policy': 'Policy ID' } },
        },
        'Claim Record': {
          Attributes: ['Policy ID', 'Claim Amount', 'Claim Date'],
          'Primary key': ['Policy ID'],
          'Foreign key': { 'Policy ID': { 'Payment Record': 'Policy ID' } },
        },
        'Medical Record': {
          Attributes: ['Customer ID', 'Visit Time', 'Visit Cost'],
          'Primary key': ['Customer ID', 'Visit Time'],
          'Foreign key': { 'Customer ID': { Customer: 'Customer ID' } },
        },
      }

      // --- candidate
      const candidate: Schemas = {
        'Insurance Agent': {
          Attributes: ['Agent ID', 'Name', 'Hire Date', 'Contact Phone'],
          'Primary key': ['Agent ID'],
          'Foreign key': {},
        },
        Customer: {
          Attributes: [
            'Customer ID',
            'Agent ID',
            'Name',
            'ID Card Number',
            'Contact Phone',
          ],
          'Primary key': ['Customer ID'],
          'Foreign key': {
            'Agent ID': { 'Insurance Agent': 'Agent ID' },
          },
        },
        Policy: {
          Attributes: [
            'Policy ID',
            'Agent ID',
            'Customer ID',
            'Insurance Type',
            'Insured Amount',
            'Insurance Term',
            'Premium',
          ],
          'Primary key': ['Policy ID'],
          'Foreign key': {
            'Agent ID': { 'Insurance Agent': 'Agent ID' },
            'Customer ID': { Customer: 'Customer ID' },
          },
        },
        Payment: {
          Attributes: [
            'ID',
            'Policy ID',
            'Payment Amount',
            'Payment Date',
            'Payment Method',
          ],
          'Primary key': ['ID'],
          'Foreign key': { 'Policy ID': { Policy: 'Policy ID' } },
        },
        'Claim Record': {
          Attributes: [
            'ID',
            'Status',
            'Policy ID',
            'Claim Amount',
            'Claim Date',
          ],
          'Primary key': ['ID'],
          'Foreign key': { 'Policy ID': { Policy: 'Policy ID' } },
        },
        'Medical Record': {
          Attributes: [
            'ID',
            'Hospital',
            'Customer ID',
            'Description',
            'Record Date',
          ],
          'Primary key': ['ID'],
          'Foreign key': { 'Customer ID': { Customer: 'Customer ID' } },
        },
      }

      const result = await evaluate(reference, candidate)

      // Check the specific contents of schema mapping/attribute mapping
      expect(result.schemaMapping).toMatchObject({
        'Insurance Agent': 'Insurance Agent',
        Customer: 'Customer',
        'Claim Record': 'Claim Record',
        'Medical Record': 'Medical Record',
        // Approximation OK
        'Payment Record': 'Payment',
        // Approximation OK
        'Insurance Policy': 'Policy',
      })

      // Assert representative value
      expect(result.schemaF1).toBe(1)
      expect(result.schemaAllcorrect).toBe(1)
      expect(result.attributeF1Avg).toBeCloseTo(0.79, 1)
      expect(result.attributeAllcorrectAvg).toBeCloseTo(0.33, 1)
      expect(result.primaryKeyAvg).toBeCloseTo(0.5, 1)
      expect(result.foreignKeyAvg).toBeCloseTo(0.83, 1)
      expect(result.schemaAllcorrectFull).toBe(0)
    },
    TIMEOUT,
  )
})
