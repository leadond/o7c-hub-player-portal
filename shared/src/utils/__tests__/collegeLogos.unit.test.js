import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getCollegeLogo, getOfficialName } from '../collegeLogos'

// Mock the logos data promise
vi.mock('../collegeLogos', async () => {
  const actual = await vi.importActual('../collegeLogos')
  return {
    ...actual,
    logosDataPromise: Promise.resolve([
      {
        name: "Alabama",
        abbreviation: "ALA",
        conference: "SEC",
        division: "FBS",
        logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/ala.png",
        alternativeNames: ["Alabama", "Bama"]
      },
      {
        name: "Ohio State",
        abbreviation: "OSU",
        conference: "Big Ten",
        division: "FBS",
        logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/osu.png",
        alternativeNames: ["Ohio State", "Ohio"]
      },
      {
        name: "Florida State",
        abbreviation: "FSU",
        conference: "ACC",
        division: "FBS",
        logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/fsu.png",
        alternativeNames: ["Florida State", "Florida"]
      }
    ])
  }
})

describe('College Logo Utility Functions', () => {
  let mockLogosData

  beforeEach(() => {
    mockLogosData = [
      {
        name: "Alabama",
        abbreviation: "ALA",
        conference: "SEC",
        division: "FBS",
        logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/ala.png",
        alternativeNames: ["Alabama", "Bama"]
      },
      {
        name: "Ohio State",
        abbreviation: "OSU",
        conference: "Big Ten",
        division: "FBS",
        logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/osu.png",
        alternativeNames: ["Ohio State", "Ohio"]
      },
      {
        name: "Florida State",
        abbreviation: "FSU",
        conference: "ACC",
        division: "FBS",
        logo: "https://a.espncdn.com/i/teamlogos/ncaa/500/fsu.png",
        alternativeNames: ["Florida State", "Florida"]
      }
    ]
  })

  describe('getCollegeLogo', () => {
    it('should return null when logosData is null', () => {
      const result = getCollegeLogo(null, 'Alabama')
      expect(result).toBeNull()
    })

    it('should return null for invalid schoolName', () => {
      const result = getCollegeLogo(mockLogosData, null)
      expect(result).toBeNull()
    })

    it('should return null for non-string schoolName', () => {
      const result = getCollegeLogo(mockLogosData, 123)
      expect(result).toBeNull()
    })

    it('should find exact match by main name', () => {
      const result = getCollegeLogo(mockLogosData, 'Alabama')
      expect(result).toBe('https://a.espncdn.com/i/teamlogos/ncaa/500/ala.png')
    })

    it('should find exact match by alternative name', () => {
      const result = getCollegeLogo(mockLogosData, 'Bama')
      expect(result).toBe('https://a.espncdn.com/i/teamlogos/ncaa/500/ala.png')
    })

    it('should be case insensitive', () => {
      const result = getCollegeLogo(mockLogosData, 'alabama')
      expect(result).toBe('https://a.espncdn.com/i/teamlogos/ncaa/500/ala.png')
    })

    it('should handle partial matches when input is significantly shorter', () => {
      const result = getCollegeLogo(mockLogosData, 'State')
      expect(result).toBe('https://a.espncdn.com/i/teamlogos/ncaa/500/osu.png') // Ohio State
    })

    it('should find word-based matches with at least 2 matching words', () => {
      // Test with a school that has multiple matching words
      const testData = [
        {
          name: "University of Test State",
          logo: "https://test.com/logo.png",
          alternativeNames: []
        }
      ]
      const result = getCollegeLogo(testData, 'Test State University')
      expect(result).toBe('https://test.com/logo.png')
    })

    it('should use fuzzy matching for close matches', () => {
      const result = getCollegeLogo(mockLogosData, 'Alabamma') // One character difference
      expect(result).toBe('https://a.espncdn.com/i/teamlogos/ncaa/500/ala.png')
    })

    it('should return null for no match', () => {
      const result = getCollegeLogo(mockLogosData, 'Nonexistent University')
      expect(result).toBeNull()
    })

    it('should normalize input by removing special characters and extra spaces', () => {
      const result = getCollegeLogo(mockLogosData, 'Ohio  State!')
      expect(result).toBe('https://a.espncdn.com/i/teamlogos/ncaa/500/osu.png')
    })

    it('should handle empty string input', () => {
      const result = getCollegeLogo(mockLogosData, '')
      expect(result).toBeNull()
    })

    it('should handle whitespace-only input', () => {
      const result = getCollegeLogo(mockLogosData, '   ')
      expect(result).toBeNull()
    })
  })

  describe('getOfficialName', () => {
    it('should return original name when logosData is null', () => {
      const result = getOfficialName(null, 'Alabama')
      expect(result).toBe('Alabama')
    })

    it('should return original name for invalid schoolName', () => {
      const result = getOfficialName(mockLogosData, null)
      expect(result).toBeNull()
    })

    it('should return original name for non-string schoolName', () => {
      const result = getOfficialName(mockLogosData, 123)
      expect(result).toBe(123)
    })

    it('should find exact match by main name', () => {
      const result = getOfficialName(mockLogosData, 'Alabama')
      expect(result).toBe('Alabama')
    })

    it('should find exact match by alternative name', () => {
      const result = getOfficialName(mockLogosData, 'Bama')
      expect(result).toBe('Alabama')
    })

    it('should be case insensitive', () => {
      const result = getOfficialName(mockLogosData, 'alabama')
      expect(result).toBe('Alabama')
    })

    it('should handle partial matches when input is significantly shorter', () => {
      const result = getOfficialName(mockLogosData, 'State')
      expect(result).toBe('Ohio State')
    })

    it('should find word-based matches with at least 2 matching words', () => {
      // Test with a school that has multiple matching words
      const testData = [
        {
          name: "University of Test State",
          logo: "https://test.com/logo.png",
          alternativeNames: []
        }
      ]
      const result = getOfficialName(testData, 'Test State University')
      expect(result).toBe('University of Test State')
    })

    it('should use fuzzy matching for close matches', () => {
      const result = getOfficialName(mockLogosData, 'Alabamma')
      expect(result).toBe('Alabama')
    })

    it('should return original name for no match', () => {
      const result = getOfficialName(mockLogosData, 'Nonexistent University')
      expect(result).toBe('Nonexistent University')
    })

    it('should normalize input by removing special characters and extra spaces', () => {
      const result = getOfficialName(mockLogosData, 'Ohio  State!')
      expect(result).toBe('Ohio State')
    })

    it('should handle empty string input', () => {
      const result = getOfficialName(mockLogosData, '')
      expect(result).toBe('')
    })

    it('should handle whitespace-only input', () => {
      const result = getOfficialName(mockLogosData, '   ')
      expect(result).toBe('   ')
    })
  })

  describe('Normalization and Matching Logic', () => {
    it('should properly normalize names by converting to lowercase and removing special chars', () => {
      // Test the normalization function indirectly through the main functions
      const result1 = getCollegeLogo(mockLogosData, 'OHIO STATE')
      const result2 = getCollegeLogo(mockLogosData, 'ohio-state')
      const result3 = getCollegeLogo(mockLogosData, 'Ohio_State!')

      expect(result1).toBe('https://a.espncdn.com/i/teamlogos/ncaa/500/osu.png')
      expect(result2).toBe('https://a.espncdn.com/i/teamlogos/ncaa/500/osu.png')
      expect(result3).toBe('https://a.espncdn.com/i/teamlogos/ncaa/500/osu.png')
    })

    it('should handle ampersand conversion', () => {
      // Add a test school with ampersand
      const testData = [...mockLogosData, {
        name: "Test & School",
        logo: "https://example.com/logo.png",
        alternativeNames: []
      }]

      const result = getCollegeLogo(testData, 'Test and School')
      expect(result).toBe('https://example.com/logo.png')
    })

    it('should prioritize exact matches over fuzzy matches', () => {
      const testData = [
        { name: "Test University", logo: "https://exact.com/logo.png", alternativeNames: [] },
        { name: "Test University of Something", logo: "https://fuzzy.com/logo.png", alternativeNames: [] }
      ]

      const result = getCollegeLogo(testData, 'Test University')
      expect(result).toBe('https://exact.com/logo.png')
    })

    it('should handle multiple alternative names', () => {
      const testData = [{
        name: "Test School",
        logo: "https://test.com/logo.png",
        alternativeNames: ["Alt1", "Alt2", "Alt3"]
      }]

      expect(getCollegeLogo(testData, 'Alt1')).toBe('https://test.com/logo.png')
      expect(getCollegeLogo(testData, 'Alt2')).toBe('https://test.com/logo.png')
      expect(getCollegeLogo(testData, 'Alt3')).toBe('https://test.com/logo.png')
    })
  })

  describe('Edge Cases', () => {
    it('should handle schools without alternativeNames array', () => {
      const testData = [{
        name: "Test School",
        logo: "https://test.com/logo.png"
        // No alternativeNames property
      }]

      const result = getCollegeLogo(testData, 'Test School')
      expect(result).toBe('https://test.com/logo.png')
    })

    it('should handle empty alternativeNames array', () => {
      const testData = [{
        name: "Test School",
        logo: "https://test.com/logo.png",
        alternativeNames: []
      }]

      const result = getCollegeLogo(testData, 'Test School')
      expect(result).toBe('https://test.com/logo.png')
    })

    it('should handle undefined alternativeNames', () => {
      const testData = [{
        name: "Test School",
        logo: "https://test.com/logo.png",
        alternativeNames: undefined
      }]

      const result = getCollegeLogo(testData, 'Test School')
      expect(result).toBe('https://test.com/logo.png')
    })

    it('should handle very short inputs that could cause false positives', () => {
      const result = getCollegeLogo(mockLogosData, 'a') // Very short input
      expect(result).toBeNull()
    })

    it('should handle inputs with only common words', () => {
      const result = getCollegeLogo(mockLogosData, 'the university of')
      expect(result).toBeNull()
    })
  })
})