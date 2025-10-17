import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import FilterablePlayerTable from '../../components/roster/FilterablePlayerTable'
import { getCollegeLogo, getOfficialName } from '../collegeLogos'

// Mock framer-motion and lucide-react for component tests
vi.mock('framer-motion', () => ({
  motion: {
    tr: ({ children, ...props }) => <tr {...props}>{children}</tr>,
    div: ({ children, ...props }) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }) => children
}))

vi.mock('lucide-react', () => ({
  ChevronDown: () => <div data-testid="chevron-down">↓</div>,
  ChevronUp: () => <div data-testid="chevron-up">↑</div>,
  Star: ({ className }) => <div data-testid="star" className={className}>★</div>,
  Phone: () => <div data-testid="phone">📞</div>,
  Users: () => <div data-testid="users">👥</div>
}))

describe('College Logo Integration Tests', () => {
  const mockOnPlayerClick = vi.fn()

  // Sample player data with various commitment scenarios
  const playersWithCommitments = [
    {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      position: 'QB',
      class: 2025,
      stars: 4,
      offers: 15,
      highSchool: 'Franklin High School',
      commitment: 'Alabama'
    },
    {
      id: '2',
      firstName: 'Jane',
      lastName: 'Smith',
      position: 'RB',
      class: 2026,
      stars: 5,
      offers: 25,
      highSchool: 'Lincoln High School',
      commitment: 'Ohio State'
    },
    {
      id: '3',
      firstName: 'Bob',
      lastName: 'Johnson',
      position: 'WR',
      class: 2024,
      stars: 3,
      offers: 8,
      highSchool: 'Washington High School',
      commitment: null // Uncommitted
    },
    {
      id: '4',
      firstName: 'Alice',
      lastName: 'Brown',
      position: 'TE',
      class: 2025,
      stars: 4,
      offers: 12,
      highSchool: 'Jefferson High School',
      commitment: 'Florida State' // Alternative name match
    },
    {
      id: '5',
      firstName: 'Charlie',
      lastName: 'Wilson',
      position: 'OL',
      class: 2026,
      stars: 3,
      offers: 6,
      highSchool: 'Adams High School',
      commitment: 'Bama' // Alternative name for Alabama
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Logo Matching Integration', () => {
    it('should correctly match and display logos for committed players', async () => {
      render(<FilterablePlayerTable players={playersWithCommitments} onPlayerClick={mockOnPlayerClick} />)

      // Wait for logos to load and be displayed
      await waitFor(() => {
        // Alabama logo should appear for both "Alabama" and "Bama" commitments
        const alabamaLogos = screen.getAllByAltText('Alabama logo')
        expect(alabamaLogos).toHaveLength(2) // John Doe and Charlie Wilson

        // Ohio State logo
        const ohioStateLogo = screen.getByAltText('Ohio State logo')
        expect(ohioStateLogo).toBeInTheDocument()

        // Florida State logo
        const floridaStateLogo = screen.getByAltText('Florida State logo')
        expect(floridaStateLogo).toBeInTheDocument()
      })

      // Verify correct logo URLs
      await waitFor(() => {
        const alabamaLogo = screen.getByAltText('Alabama logo')
        expect(alabamaLogo.src).toBe('https://a.espncdn.com/i/teamlogos/ncaa/500/ala.png')

        const ohioStateLogo = screen.getByAltText('Ohio State logo')
        expect(ohioStateLogo.src).toBe('https://a.espncdn.com/i/teamlogos/ncaa/500/osu.png')

        const floridaStateLogo = screen.getByAltText('Florida State logo')
        expect(floridaStateLogo.src).toBe('https://a.espncdn.com/i/teamlogos/ncaa/500/fsu.png')
      })
    })

    it('should display official names for committed players', async () => {
      render(<FilterablePlayerTable players={playersWithCommitments} onPlayerClick={mockOnPlayerClick} />)

      await waitFor(() => {
        // Should show official names, not the commitment strings
        expect(screen.getByText('Alabama')).toBeInTheDocument()
        expect(screen.getByText('Ohio State')).toBeInTheDocument()
        expect(screen.getByText('Florida State')).toBeInTheDocument()
      })

      // Should not show the alternative names in the display
      expect(screen.queryByText('Bama')).not.toBeInTheDocument()
    })

    it('should handle uncommitted players without logos', async () => {
      render(<FilterablePlayerTable players={[playersWithCommitments[2]]} onPlayerClick={mockOnPlayerClick} />)

      await waitFor(() => {
        // Should show "Uncommitted" text
        expect(screen.getByText('Uncommitted')).toBeInTheDocument()

        // Should not have any logo images
        const logos = screen.queryAllByRole('img')
        const collegeLogos = logos.filter(img => img.alt.includes('logo'))
        expect(collegeLogos).toHaveLength(0)
      })
    })

    it('should handle fuzzy matching for close name matches', async () => {
      const playerWithFuzzyMatch = [{
        id: '6',
        firstName: 'Test',
        lastName: 'Player',
        position: 'QB',
        class: 2025,
        stars: 3,
        offers: 5,
        highSchool: 'Test High School',
        commitment: 'Alabamma' // Close but not exact match to Alabama
      }]

      render(<FilterablePlayerTable players={playerWithFuzzyMatch} onPlayerClick={mockOnPlayerClick} />)

      await waitFor(() => {
        // Should still find Alabama logo through fuzzy matching
        const alabamaLogo = screen.getByAltText('Alabama logo')
        expect(alabamaLogo).toBeInTheDocument()
        expect(alabamaLogo.src).toBe('https://a.espncdn.com/i/teamlogos/ncaa/500/ala.png')
      })
    })

    it('should handle case insensitive matching', async () => {
      const playerWithCaseMismatch = [{
        id: '7',
        firstName: 'Test',
        lastName: 'Player',
        position: 'QB',
        class: 2025,
        stars: 3,
        offers: 5,
        highSchool: 'Test High School',
        commitment: 'alabama' // lowercase
      }]

      render(<FilterablePlayerTable players={playerWithCaseMismatch} onPlayerClick={mockOnPlayerClick} />)

      await waitFor(() => {
        const alabamaLogo = screen.getByAltText('Alabama logo')
        expect(alabamaLogo).toBeInTheDocument()
      })
    })

    it('should handle word-based matching', async () => {
      const playerWithWordMatch = [{
        id: '8',
        firstName: 'Test',
        lastName: 'Player',
        position: 'QB',
        class: 2025,
        stars: 3,
        offers: 5,
        highSchool: 'Test High School',
        commitment: 'Ohio University' // Contains "Ohio"
      }]

      render(<FilterablePlayerTable players={playerWithWordMatch} onPlayerClick={mockOnPlayerClick} />)

      await waitFor(() => {
        const ohioStateLogo = screen.getByAltText('Ohio State logo')
        expect(ohioStateLogo).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle logo loading failures gracefully', async () => {
      // Mock fetch to reject for logo loading
      global.fetch = vi.fn(() => Promise.reject(new Error('Network error')))

      render(<FilterablePlayerTable players={[playersWithCommitments[0]]} onPlayerClick={mockOnPlayerClick} />)

      // Component should still render without crashing
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Committed')).toBeInTheDocument()
      })

      // Restore fetch
      global.fetch = vi.fn()
    })

    it('should handle invalid commitment data', async () => {
      const playerWithInvalidCommitment = [{
        id: '9',
        firstName: 'Test',
        lastName: 'Player',
        position: 'QB',
        class: 2025,
        stars: 3,
        offers: 5,
        highSchool: 'Test High School',
        commitment: '' // Empty string
      }]

      render(<FilterablePlayerTable players={playerWithInvalidCommitment} onPlayerClick={mockOnPlayerClick} />)

      await waitFor(() => {
        expect(screen.getByText('Uncommitted')).toBeInTheDocument()
      })
    })

    it('should handle non-string commitment values', async () => {
      const playerWithNonStringCommitment = [{
        id: '10',
        firstName: 'Test',
        lastName: 'Player',
        position: 'QB',
        class: 2025,
        stars: 3,
        offers: 5,
        highSchool: 'Test High School',
        commitment: 12345 // Number instead of string
      }]

      render(<FilterablePlayerTable players={playerWithNonStringCommitment} onPlayerClick={mockOnPlayerClick} />)

      await waitFor(() => {
        expect(screen.getByText('Uncommitted')).toBeInTheDocument()
      })
    })
  })

  describe('Performance and Scalability', () => {
    it('should handle large numbers of players efficiently', async () => {
      const largePlayerList = Array.from({ length: 50 }, (_, i) => ({
        ...playersWithCommitments[0],
        id: `player-${i}`,
        firstName: `Player${i}`,
        lastName: `Test${i}`,
        commitment: i % 2 === 0 ? 'Alabama' : 'Ohio State'
      }))

      const startTime = Date.now()
      render(<FilterablePlayerTable players={largePlayerList} onPlayerClick={mockOnPlayerClick} />)

      await waitFor(() => {
        const rows = screen.getAllByRole('row')
        expect(rows).toHaveLength(51) // 50 players + 1 header
      })

      const endTime = Date.now()
      const renderTime = endTime - startTime

      // Should render within reasonable time (less than 5 seconds)
      expect(renderTime).toBeLessThan(5000)
    })

    it('should handle players with various commitment states', async () => {
      const mixedCommitmentPlayers = [
        { ...playersWithCommitments[0], commitment: 'Alabama' },
        { ...playersWithCommitments[1], commitment: null },
        { ...playersWithCommitments[2], commitment: 'Ohio State' },
        { ...playersWithCommitments[3], commitment: '' },
        { ...playersWithCommitments[4], commitment: 'Florida State' }
      ]

      render(<FilterablePlayerTable players={mixedCommitmentPlayers} onPlayerClick={mockOnPlayerClick} />)

      await waitFor(() => {
        // Should have 3 logos (Alabama x2, Ohio State, Florida State)
        const logos = screen.getAllByRole('img').filter(img => img.alt.includes('logo'))
        expect(logos).toHaveLength(4) // Alabama appears twice

        // Should have 2 uncommitted players
        const uncommittedTexts = screen.getAllByText('Uncommitted')
        expect(uncommittedTexts).toHaveLength(2)
      })
    })
  })

  describe('Data Consistency', () => {
    it('should maintain data integrity across re-renders', async () => {
      const { rerender } = render(<FilterablePlayerTable players={playersWithCommitments} onPlayerClick={mockOnPlayerClick} />)

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Alabama')).toBeInTheDocument()
      })

      // Re-render with same data
      rerender(<FilterablePlayerTable players={playersWithCommitments} onPlayerClick={mockOnPlayerClick} />)

      await waitFor(() => {
        // Data should still be consistent
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Alabama')).toBeInTheDocument()
      })
    })

    it('should handle dynamic data updates', async () => {
      const { rerender } = render(<FilterablePlayerTable players={[playersWithCommitments[0]]} onPlayerClick={mockOnPlayerClick} />)

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      // Update player data
      const updatedPlayers = [{
        ...playersWithCommitments[0],
        commitment: 'Ohio State' // Changed commitment
      }]

      rerender(<FilterablePlayerTable players={updatedPlayers} onPlayerClick={mockOnPlayerClick} />)

      await waitFor(() => {
        // Should show new commitment
        expect(screen.getByText('Ohio State')).toBeInTheDocument()
        const ohioStateLogo = screen.getByAltText('Ohio State logo')
        expect(ohioStateLogo).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should provide proper alt text for logo images', async () => {
      render(<FilterablePlayerTable players={[playersWithCommitments[0]]} onPlayerClick={mockOnPlayerClick} />)

      await waitFor(() => {
        const logo = screen.getByAltText('Alabama logo')
        expect(logo).toBeInTheDocument()
        expect(logo.alt).toBe('Alabama logo')
      })
    })

    it('should maintain proper table structure for screen readers', async () => {
      render(<FilterablePlayerTable players={playersWithCommitments} onPlayerClick={mockOnPlayerClick} />)

      await waitFor(() => {
        const table = screen.getByRole('table')
        expect(table).toBeInTheDocument()

        const headers = screen.getAllByRole('columnheader')
        expect(headers).toHaveLength(7) // Name, Position, Class, Rating, Offers, School, Status

        const rows = screen.getAllByRole('row')
        expect(rows).toHaveLength(6) // Header + 5 players
      })
    })
  })
})