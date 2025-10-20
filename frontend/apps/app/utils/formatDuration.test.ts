import { describe, expect, it } from 'vitest'
import { formatDuration } from './formatDuration'

describe('formatDuration', () => {
  it('formats seconds only when less than 1 minute', () => {
    expect(formatDuration(5000)).toBe('5s')
    expect(formatDuration(30000)).toBe('30s')
    expect(formatDuration(59000)).toBe('59s')
  })

  it('formats minutes and seconds', () => {
    expect(formatDuration(65000)).toBe('1m 5s')
    expect(formatDuration(150000)).toBe('2m 30s')
    expect(formatDuration(185000)).toBe('3m 5s')
  })

  it('handles exact minutes', () => {
    expect(formatDuration(60000)).toBe('1m 0s')
    expect(formatDuration(120000)).toBe('2m 0s')
    expect(formatDuration(300000)).toBe('5m 0s')
  })

  it('handles 0 seconds', () => {
    expect(formatDuration(0)).toBe('0s')
    expect(formatDuration(500)).toBe('0s') // Less than 1 second rounds down
  })

  it('handles large durations', () => {
    expect(formatDuration(3600000)).toBe('60m 0s') // 1 hour
    expect(formatDuration(3665000)).toBe('61m 5s') // 1 hour 1 min 5 sec
  })

  it('rounds down milliseconds', () => {
    expect(formatDuration(5999)).toBe('5s')
    expect(formatDuration(65999)).toBe('1m 5s')
  })
})
