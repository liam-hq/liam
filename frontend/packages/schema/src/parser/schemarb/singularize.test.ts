import { describe, expect, it } from 'vitest'
import { singularize } from './singularize.js'

describe('singularize', () => {
  it('should convert addresses to address', () => {
    expect(singularize('addresses')).toBe('address')
  })

  it('should convert analyses to analysis', () => {
    expect(singularize('analyses')).toBe('analysis')
  })

  it('should convert buses to bus', () => {
    expect(singularize('buses')).toBe('bus')
  })

  it('should convert movies to movie', () => {
    expect(singularize('movies')).toBe('movie')
  })

  it('should convert oxen to ox', () => {
    expect(singularize('oxen')).toBe('ox')
  })

  it('should convert indexes to index', () => {
    expect(singularize('indexes')).toBe('index')
  })

  it('should convert matrices to matrix', () => {
    expect(singularize('matrices')).toBe('matrix')
  })

  it('should convert quizzes to quiz', () => {
    expect(singularize('quizzes')).toBe('quiz')
  })

  it('should convert databases to database', () => {
    expect(singularize('databases')).toBe('database')
  })

  it('should convert aliases to alias', () => {
    expect(singularize('aliases')).toBe('alias')
  })

  it('should convert statuses to status', () => {
    expect(singularize('statuses')).toBe('status')
  })

  it('should convert shoes to shoe', () => {
    expect(singularize('shoes')).toBe('shoe')
  })

  it('should convert parties to party', () => {
    expect(singularize('parties')).toBe('party')
  })

  it('should convert calves to calf', () => {
    expect(singularize('calves')).toBe('calf')
  })

  it('should convert wolves to wolf', () => {
    expect(singularize('wolves')).toBe('wolf')
  })

  it('should convert lives to life', () => {
    expect(singularize('lives')).toBe('life')
  })

  it('should convert series to series', () => {
    expect(singularize('series')).toBe('series')
  })

  it('should convert status to status', () => {
    expect(singularize('status')).toBe('status')
  })
})
