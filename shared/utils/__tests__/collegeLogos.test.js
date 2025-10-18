import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getCollegeLogo } from '../collegeLogos'

// Mock the collegeLogos.json data
const mockLogosData = [
  {
    name: 'Alabama Crimson Tide',
    logo: 'https://content.sportslogos.net/logos/30/597/thumbs/59771422018.gif'
  },
  {
    name: 'Auburn Tigers',
    logo: 'https://content.sportslogos.net/logos/30/610/thumbs/61011451968.gif'
  },
  {
    name: 'University of Alabama',
    logo: 'https://content.sportslogos.net/logos/30/597/thumbs/59771422018.gif'
  }
]

describe('getCollegeLogo', () => {
  it('should return null when logosData is null', () => {
    const result = getCollegeLogo(null, 'Alabama Crimson Tide')
    expect(result).toBeNull()
  })

  it('should return null when logosData is undefined', () => {
    const result = getCollegeLogo(undefined, 'Alabama Crimson Tide')
    expect(result).toBeNull()
  })

  it('should find exact match', () => {
    const result = getCollegeLogo(mockLogosData, 'Alabama Crimson Tide')
    expect(result).toBe('https://content.sportslogos.net/logos/30/597/thumbs/59771422018.gif')
  })

  it('should find partial match', () => {
    const result = getCollegeLogo(mockLogosData, 'Alabama')
    expect(result).toBe('https://content.sportslogos.net/logos/30/597/thumbs/59771422018.gif')
  })

  it('should find reverse partial match', () => {
    const result = getCollegeLogo(mockLogosData, 'Crimson Tide Alabama')
    expect(result).toBe('https://content.sportslogos.net/logos/30/597/thumbs/59771422018.gif')
  })

  it('should find word-based match', () => {
    const result = getCollegeLogo(mockLogosData, 'Tigers Auburn')
    expect(result).toBe('https://content.sportslogos.net/logos/30/610/thumbs/61011451968.gif')
  })

  it('should handle case insensitive matching', () => {
    const result = getCollegeLogo(mockLogosData, 'alabama crimson tide')
    expect(result).toBe('https://content.sportslogos.net/logos/30/597/thumbs/59771422018.gif')
  })

  it('should handle normalization (ampersand to and)', () => {
    const logosWithAmpersand = [
      {
        name: 'Texas A&M Aggies',
        logo: 'https://example.com/texas-am-logo.png'
      }
    ]
    const result = getCollegeLogo(logosWithAmpersand, 'Texas A and M Aggies')
    expect(result).toBe('https://example.com/texas-am-logo.png')
  })

  it('should return null when no match is found', () => {
    const result = getCollegeLogo(mockLogosData, 'Nonexistent School XYZ123')
    expect(result).toBeNull()
  })

  it('should handle empty school name', () => {
    const result = getCollegeLogo(mockLogosData, '')
    expect(result).toBeNull()
  })

  it('should handle null school name', () => {
    const result = getCollegeLogo(mockLogosData, null)
    expect(result).toBeNull()
  })

  it('should handle undefined school name', () => {
    const result = getCollegeLogo(mockLogosData, undefined)
    expect(result).toBeNull()
  })
})