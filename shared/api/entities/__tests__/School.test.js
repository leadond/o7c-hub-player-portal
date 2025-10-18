import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { School } from '../School'

// Mock the firebaseClient
const mockFirebaseClient = {
  entities: {
    School: {
      list: vi.fn(),
      filter: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    }
  }
}

vi.mock('../../base44Client.js', () => ({
  firebaseClient: mockFirebaseClient
}))

describe('School Entity', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('list', () => {
    it('should call firebaseClient.entities.School.list with correct parameters', async () => {
      const mockData = [
        { id: '1', name: 'Test School 1', irn: '12345' },
        { id: '2', name: 'Test School 2', irn: '67890' }
      ]
      mockFirebaseClient.entities.School.list.mockResolvedValue(mockData)

      const result = await School.list('-created_date', 100)

      expect(mockFirebaseClient.entities.School.list).toHaveBeenCalledWith('-created_date', 100)
      expect(result).toEqual(mockData)
    })

    it('should call list with default parameters when none provided', async () => {
      const mockData = [{ id: '1', name: 'Test School' }]
      mockFirebaseClient.entities.School.list.mockResolvedValue(mockData)

      const result = await School.list()

      expect(mockFirebaseClient.entities.School.list).toHaveBeenCalledWith('-created_date', null)
      expect(result).toEqual(mockData)
    })

    it('should handle empty results', async () => {
      mockFirebaseClient.entities.School.list.mockResolvedValue([])

      const result = await School.list()

      expect(result).toEqual([])
    })

    it('should handle null results', async () => {
      mockFirebaseClient.entities.School.list.mockResolvedValue(null)

      const result = await School.list()

      expect(result).toBeNull()
    })

    it('should propagate errors from firebaseClient', async () => {
      const error = new Error('Database connection failed')
      mockFirebaseClient.entities.School.list.mockRejectedValue(error)

      await expect(School.list()).rejects.toThrow('Database connection failed')
    })
  })

  describe('filter', () => {
    it('should call firebaseClient.entities.School.filter with filters and limit', async () => {
      const filters = { name: 'Test School', county: 'Test County' }
      const mockData = [{ id: '1', name: 'Test School', county: 'Test County' }]
      mockFirebaseClient.entities.School.filter.mockResolvedValue(mockData)

      const result = await School.filter(filters, 50)

      expect(mockFirebaseClient.entities.School.filter).toHaveBeenCalledWith(filters, 50)
      expect(result).toEqual(mockData)
    })

    it('should call filter with default limit when not provided', async () => {
      const filters = { irn: '12345' }
      const mockData = [{ id: '1', irn: '12345' }]
      mockFirebaseClient.entities.School.filter.mockResolvedValue(mockData)

      const result = await School.filter(filters)

      expect(mockFirebaseClient.entities.School.filter).toHaveBeenCalledWith(filters, null)
      expect(result).toEqual(mockData)
    })

    it('should handle empty filters object', async () => {
      const mockData = [{ id: '1', name: 'All Schools' }]
      mockFirebaseClient.entities.School.filter.mockResolvedValue(mockData)

      const result = await School.filter({})

      expect(mockFirebaseClient.entities.School.filter).toHaveBeenCalledWith({}, null)
      expect(result).toEqual(mockData)
    })

    it('should handle complex filter queries', async () => {
      const complexFilters = {
        name: { $regex: 'High School', $options: 'i' },
        county: 'Franklin',
        type: 'Public'
      }
      const mockData = [{ id: '1', name: 'Franklin High School', county: 'Franklin', type: 'Public' }]
      mockFirebaseClient.entities.School.filter.mockResolvedValue(mockData)

      const result = await School.filter(complexFilters, 10)

      expect(mockFirebaseClient.entities.School.filter).toHaveBeenCalledWith(complexFilters, 10)
      expect(result).toEqual(mockData)
    })
  })

  describe('create', () => {
    it('should call firebaseClient.entities.School.create with school data', async () => {
      const schoolData = {
        irn: '12345',
        name: 'Test High School',
        county: 'Test County',
        district: 'Test District',
        type: 'Public',
        website: 'https://test.edu',
        phone: '555-1234',
        notes: 'Test school notes'
      }
      const createdSchool = { id: 'new-id', ...schoolData }
      mockFirebaseClient.entities.School.create.mockResolvedValue(createdSchool)

      const result = await School.create(schoolData)

      expect(mockFirebaseClient.entities.School.create).toHaveBeenCalledWith(schoolData)
      expect(result).toEqual(createdSchool)
    })

    it('should handle minimal school data', async () => {
      const minimalData = {
        irn: '67890',
        name: 'Minimal School'
      }
      const createdSchool = { id: 'minimal-id', ...minimalData }
      mockFirebaseClient.entities.School.create.mockResolvedValue(createdSchool)

      const result = await School.create(minimalData)

      expect(mockFirebaseClient.entities.School.create).toHaveBeenCalledWith(minimalData)
      expect(result).toEqual(createdSchool)
    })

    it('should handle school creation with logo_url', async () => {
      const schoolWithLogo = {
        irn: '99999',
        name: 'Logo School',
        logo_url: 'https://example.com/logo.png'
      }
      const createdSchool = { id: 'logo-id', ...schoolWithLogo }
      mockFirebaseClient.entities.School.create.mockResolvedValue(createdSchool)

      const result = await School.create(schoolWithLogo)

      expect(mockFirebaseClient.entities.School.create).toHaveBeenCalledWith(schoolWithLogo)
      expect(result).toEqual(createdSchool)
    })

    it('should propagate validation errors', async () => {
      const invalidData = { name: '' } // Missing required irn
      const error = new Error('Validation failed: IRN is required')
      mockFirebaseClient.entities.School.create.mockRejectedValue(error)

      await expect(School.create(invalidData)).rejects.toThrow('Validation failed: IRN is required')
    })

    it('should handle duplicate IRN errors', async () => {
      const duplicateData = { irn: '12345', name: 'Duplicate School' }
      const error = new Error('Duplicate IRN: School with this IRN already exists')
      mockFirebaseClient.entities.School.create.mockRejectedValue(error)

      await expect(School.create(duplicateData)).rejects.toThrow('Duplicate IRN: School with this IRN already exists')
    })
  })

  describe('update', () => {
    it('should call firebaseClient.entities.School.update with id and data', async () => {
      const schoolId = 'school-123'
      const updateData = {
        name: 'Updated School Name',
        county: 'Updated County',
        phone: '555-5678'
      }
      const updatedSchool = { id: schoolId, ...updateData }
      mockFirebaseClient.entities.School.update.mockResolvedValue(updatedSchool)

      const result = await School.update(schoolId, updateData)

      expect(mockFirebaseClient.entities.School.update).toHaveBeenCalledWith(schoolId, updateData)
      expect(result).toEqual(updatedSchool)
    })

    it('should handle partial updates', async () => {
      const schoolId = 'school-456'
      const partialUpdate = { phone: '555-9999' }
      const updatedSchool = {
        id: schoolId,
        irn: '12345',
        name: 'Original Name',
        phone: '555-9999'
      }
      mockFirebaseClient.entities.School.update.mockResolvedValue(updatedSchool)

      const result = await School.update(schoolId, partialUpdate)

      expect(mockFirebaseClient.entities.School.update).toHaveBeenCalledWith(schoolId, partialUpdate)
      expect(result).toEqual(updatedSchool)
    })

    it('should handle logo_url updates', async () => {
      const schoolId = 'school-789'
      const logoUpdate = { logo_url: 'https://newlogo.com/logo.png' }
      const updatedSchool = { id: schoolId, logo_url: 'https://newlogo.com/logo.png' }
      mockFirebaseClient.entities.School.update.mockResolvedValue(updatedSchool)

      const result = await School.update(schoolId, logoUpdate)

      expect(mockFirebaseClient.entities.School.update).toHaveBeenCalledWith(schoolId, logoUpdate)
      expect(result).toEqual(updatedSchool)
    })

    it('should handle non-existent school updates', async () => {
      const schoolId = 'non-existent'
      const updateData = { name: 'New Name' }
      const error = new Error('School not found')
      mockFirebaseClient.entities.School.update.mockRejectedValue(error)

      await expect(School.update(schoolId, updateData)).rejects.toThrow('School not found')
    })

    it('should handle update conflicts', async () => {
      const schoolId = 'school-123'
      const updateData = { irn: '99999' }
      const error = new Error('IRN already exists for another school')
      mockFirebaseClient.entities.School.update.mockRejectedValue(error)

      await expect(School.update(schoolId, updateData)).rejects.toThrow('IRN already exists for another school')
    })
  })

  describe('remove', () => {
    it('should call firebaseClient.entities.School.delete with id', async () => {
      const schoolId = 'school-to-delete'
      mockFirebaseClient.entities.School.delete.mockResolvedValue({ success: true })

      const result = await School.remove(schoolId)

      expect(mockFirebaseClient.entities.School.delete).toHaveBeenCalledWith(schoolId)
      expect(result).toEqual({ success: true })
    })

    it('should handle successful deletion', async () => {
      const schoolId = 'delete-me'
      const deleteResult = { deleted: true, id: schoolId }
      mockFirebaseClient.entities.School.delete.mockResolvedValue(deleteResult)

      const result = await School.remove(schoolId)

      expect(result).toEqual(deleteResult)
    })

    it('should handle deletion of non-existent school', async () => {
      const schoolId = 'does-not-exist'
      const error = new Error('School not found')
      mockFirebaseClient.entities.School.delete.mockRejectedValue(error)

      await expect(School.remove(schoolId)).rejects.toThrow('School not found')
    })

    it('should handle deletion with foreign key constraints', async () => {
      const schoolId = 'school-with-students'
      const error = new Error('Cannot delete school: students are still assigned to it')
      mockFirebaseClient.entities.School.delete.mockRejectedValue(error)

      await expect(School.remove(schoolId)).rejects.toThrow('Cannot delete school: students are still assigned to it')
    })
  })

  describe('Integration Scenarios', () => {
    it('should support full CRUD workflow', async () => {
      // Create
      const newSchool = {
        irn: '11111',
        name: 'Integration Test School',
        county: 'Test County'
      }
      const createdSchool = { id: 'integration-id', ...newSchool }
      mockFirebaseClient.entities.School.create.mockResolvedValue(createdSchool)

      const createResult = await School.create(newSchool)
      expect(createResult.id).toBe('integration-id')

      // Read (list)
      const schools = [{ ...createdSchool }]
      mockFirebaseClient.entities.School.list.mockResolvedValue(schools)

      const listResult = await School.list()
      expect(listResult).toHaveLength(1)
      expect(listResult[0].name).toBe('Integration Test School')

      // Update
      const updateData = { name: 'Updated Integration School' }
      const updatedSchool = { ...createdSchool, ...updateData }
      mockFirebaseClient.entities.School.update.mockResolvedValue(updatedSchool)

      const updateResult = await School.update('integration-id', updateData)
      expect(updateResult.name).toBe('Updated Integration School')

      // Delete
      mockFirebaseClient.entities.School.delete.mockResolvedValue({ success: true })

      const deleteResult = await School.remove('integration-id')
      expect(deleteResult.success).toBe(true)
    })

    it('should handle bulk operations through filtering', async () => {
      const filters = { county: 'Franklin County' }
      const schools = [
        { id: '1', name: 'School A', county: 'Franklin County' },
        { id: '2', name: 'School B', county: 'Franklin County' }
      ]
      mockFirebaseClient.entities.School.filter.mockResolvedValue(schools)

      const result = await School.filter(filters)

      expect(result).toHaveLength(2)
      expect(result.every(school => school.county === 'Franklin County')).toBe(true)
    })

    it('should support searching by multiple criteria', async () => {
      const searchFilters = {
        name: { $regex: 'High', $options: 'i' },
        type: 'Public'
      }
      const matchingSchools = [
        { id: '1', name: 'Franklin High School', type: 'Public' },
        { id: '2', name: 'Lincoln High School', type: 'Public' }
      ]
      mockFirebaseClient.entities.School.filter.mockResolvedValue(matchingSchools)

      const result = await School.filter(searchFilters)

      expect(result).toHaveLength(2)
      expect(result.every(school => school.name.toLowerCase().includes('high'))).toBe(true)
      expect(result.every(school => school.type === 'Public')).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network request failed')
      mockFirebaseClient.entities.School.list.mockRejectedValue(networkError)

      await expect(School.list()).rejects.toThrow('Network request failed')
    })

    it('should handle authentication errors', async () => {
      const authError = new Error('Authentication failed')
      mockFirebaseClient.entities.School.create.mockRejectedValue(authError)

      const schoolData = { irn: '12345', name: 'Test School' }
      await expect(School.create(schoolData)).rejects.toThrow('Authentication failed')
    })

    it('should handle permission errors', async () => {
      const permissionError = new Error('Insufficient permissions')
      mockFirebaseClient.entities.School.update.mockRejectedValue(permissionError)

      const updateData = { name: 'New Name' }
      await expect(School.update('school-id', updateData)).rejects.toThrow('Insufficient permissions')
    })

    it('should handle database connection errors', async () => {
      const dbError = new Error('Database connection lost')
      mockFirebaseClient.entities.School.filter.mockRejectedValue(dbError)

      await expect(School.filter({})).rejects.toThrow('Database connection lost')
    })
  })
})