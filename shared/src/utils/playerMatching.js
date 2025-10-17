import { filter as filterPlayers, create as createPlayer, update as updatePlayer } from '../api/entities/Player';
import { update as updateUser } from '../api/entities/AppUser';
import { calculateMatchConfidence, sortMatchesByConfidence } from './matchConfidenceScoring';

/**
 * PlayerMatchingService - Handles matching signup users with existing players
 * and manages player profile creation/linking with proper file serialization
 */
export class PlayerMatchingService {
  
  /**
   * Find potential player matches based on signup information
   * @param {Object} playerInfo - Player information from signup
   * @param {string} playerInfo.fullName - Full name provided during signup
   * @param {string} playerInfo.firstName - First name extracted from full name
   * @param {string} playerInfo.lastName - Last name extracted from full name
   * @param {string} playerInfo.schoolIRN - School IRN selected during signup
   * @param {string} playerInfo.schoolName - School name for display
   * @param {string} playerInfo.phoneNumber - Phone number provided during signup
   * @returns {Promise<Array>} Array of potential matches with confidence scores
   */
  async findPotentialMatches(playerInfo) {
    try {
      console.log('findPotentialMatches: Starting search for:', playerInfo);
      const matches = [];

      // Normalize input data
      const normalizedPhone = this.normalizePhoneNumber(playerInfo.phoneNumber);
      const normalizedEmail = this.normalizeEmail(playerInfo.email);
      const { firstName, lastName } = this.parseFullName(playerInfo.fullName);

      const searchCriteria = {
        firstName,
        lastName,
        fullName: playerInfo.fullName,
        schoolIRN: playerInfo.schoolIRN,
        phoneNumber: normalizedPhone,
        email: normalizedEmail
      };
      console.log('findPotentialMatches: Search criteria:', searchCriteria);

      // Search for email matches (highest confidence)
      if (normalizedEmail) {
        const emailMatches = await this.findEmailMatches(normalizedEmail);
        console.log('findPotentialMatches: Email matches found:', emailMatches.length);
        matches.push(...emailMatches.map(match =>
          calculateMatchConfidence(match, searchCriteria, 'email_match')
        ));
      }

      // Search for exact name + school matches (highest confidence)
      if (playerInfo.schoolIRN && firstName && lastName) {
        const nameSchoolMatches = await this.findNameSchoolMatches(firstName, lastName, playerInfo.schoolIRN);
        console.log('findPotentialMatches: Name+school matches found:', nameSchoolMatches.length);
        matches.push(...nameSchoolMatches.map(match =>
          calculateMatchConfidence(match, searchCriteria, 'name_school')
        ));
      }

      // Search for exact name + phone matches (high confidence)
      if (normalizedPhone && firstName && lastName) {
        const namePhoneMatches = await this.findNamePhoneMatches(firstName, lastName, normalizedPhone);
        console.log('findPotentialMatches: Name+phone matches found:', namePhoneMatches.length);
        matches.push(...namePhoneMatches.map(match =>
          calculateMatchConfidence(match, searchCriteria, 'name_phone')
        ));
      }

      // Search for partial name matches (medium confidence)
      if (firstName || lastName) {
        const partialMatches = await this.findPartialNameMatches(firstName, lastName);
        console.log('findPotentialMatches: Partial name matches found:', partialMatches.length);
        matches.push(...partialMatches.map(match =>
          calculateMatchConfidence(match, searchCriteria, 'name_partial')
        ));
      }

      // Remove duplicates and sort by confidence using advanced scoring
      const uniqueMatches = this.removeDuplicateMatches(matches);
      console.log('findPotentialMatches: Total unique matches after deduplication:', uniqueMatches.length);
      const sortedMatches = sortMatchesByConfidence(uniqueMatches);
      console.log('findPotentialMatches: Final sorted matches:', sortedMatches.map(m => ({ id: m.id, confidence: m.confidenceScore, email: m.emailAddress })));
      return sortedMatches;
      
    } catch (error) {
      console.error('Error finding potential matches:', error);
      throw new Error('Failed to search for player matches');
    }
  }
  
  /**
   * Link a user account to an existing player profile
   * @param {string} userId - User ID to link
   * @param {string} playerId - Player ID to link to
   * @param {string} userEmail - User's email address
   * @param {string} adminEmail - Administrator performing the action
   * @returns {Promise<Object>} Result of linking operation
   */
  async linkUserToPlayer(userId, playerId, userEmail, adminEmail) {
    try {
      // Update user record with linked player ID
      await updateUser(userId, {
        linkedPlayerId: playerId,
        playerProfileCreated: false, // Using existing profile
        playerProfileLinkedAt: new Date().toISOString(),
        linkedBy: adminEmail,
        status: 'active',
        role: 'Player',
        invitationStatus: 'approved',
        approvedAt: new Date().toISOString(),
        approvedBy: adminEmail
      });
      
      // Update player record with user's email if different
      const existingPlayer = await this.getPlayerById(playerId);
      if (existingPlayer && existingPlayer.emailAddress !== userEmail) {
        await updatePlayer(playerId, {
          emailAddress: userEmail,
          linkedUserId: userId,
          linkedAt: new Date().toISOString()
        });
      }
      
      // Log the linking action
      await this.logAuditAction({
        action: 'user_linked',
        userId,
        playerId,
        performedBy: adminEmail,
        details: {
          userEmail,
          playerEmail: existingPlayer?.emailAddress,
          emailUpdated: existingPlayer?.emailAddress !== userEmail
        }
      });
      
      return {
        success: true,
        action: 'linked',
        playerId,
        message: 'User successfully linked to existing player profile'
      };
      
    } catch (error) {
      console.error('Error linking user to player:', error);
      throw new Error('Failed to link user to player profile');
    }
  }
  
  /**
   * Create a new player profile from signup information
   * @param {string} userId - User ID creating the profile for
   * @param {Object} playerInfo - Player information from signup
   * @param {string} adminEmail - Administrator performing the action
   * @returns {Promise<Object>} Result of profile creation
   */
  async createPlayerFromSignup(userId, playerInfo, adminEmail) {
    try {
      const { firstName, lastName } = this.parseFullName(playerInfo.fullName);
      
      // Create new player profile with signup information
      const playerData = {
        firstName: firstName || '',
        lastName: lastName || '',
        emailAddress: playerInfo.email || '',
        phoneNumber: this.normalizePhoneNumber(playerInfo.phoneNumber) || '',
        highSchoolIRN: playerInfo.schoolIRN || '',
        highSchool: playerInfo.schoolName || '',
        linkedUserId: userId,
        createdFromSignup: true,
        createdAt: new Date().toISOString(),
        createdBy: adminEmail,
        
        // Initialize file tracking fields for proper serialization
        profileFiles: {
          photos: [],
          schoolId: null,
          reportCards: [],
          highlightVideo: null
        },
        
        // Default values for required fields
        position: '',
        class: null,
        stars: 0,
        idNumber: '',
        middleName: '',
        suffix: '',
        nickname: '',
        dob: '',
        caption: ''
      };
      
      const newPlayer = await createPlayer(playerData);
      
      // Update user record with new player ID
      await updateUser(userId, {
        linkedPlayerId: newPlayer.id,
        playerProfileCreated: true,
        playerProfileCreatedAt: new Date().toISOString(),
        createdBy: adminEmail,
        status: 'active',
        invitationStatus: 'approved',
        approvedAt: new Date().toISOString(),
        approvedBy: adminEmail
      });
      
      // Log the creation action
      await this.logAuditAction({
        action: 'player_created',
        userId,
        playerId: newPlayer.id,
        performedBy: adminEmail,
        details: {
          createdFromSignup: true,
          playerData: {
            name: `${firstName} ${lastName}`.trim(),
            email: playerInfo.email,
            school: playerInfo.schoolName,
            phone: playerInfo.phoneNumber
          }
        }
      });
      
      return {
        success: true,
        action: 'created',
        playerId: newPlayer.id,
        player: newPlayer,
        message: 'New player profile created successfully'
      };
      
    } catch (error) {
      console.error('Error creating player from signup:', error);
      throw new Error('Failed to create new player profile');
    }
  }
  
  /**
   * Normalize phone number by removing formatting characters
   * @param {string} phone - Phone number to normalize
   * @returns {string} Normalized phone number
   */
  normalizePhoneNumber(phone) {
    if (!phone || typeof phone !== 'string') {
      return '';
    }

    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');

    // Handle US phone numbers - remove leading 1 if present and number is 11 digits
    if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
      return digitsOnly.substring(1);
    }

    return digitsOnly;
  }

  /**
   * Normalize email address for consistent comparison
   * @param {string} email - Email address to normalize
   * @returns {string} Normalized email address (lowercase, trimmed)
   */
  normalizeEmail(email) {
    if (!email || typeof email !== 'string') {
      return '';
    }

    return email.toLowerCase().trim();
  }
  
  /**
   * Calculate similarity between two names using string comparison
   * @param {string} name1 - First name to compare
   * @param {string} name2 - Second name to compare
   * @returns {number} Similarity score between 0 and 1
   */
  calculateNameSimilarity(name1, name2) {
    if (!name1 || !name2) return 0;
    
    const normalize = (str) => str.toLowerCase().trim().replace(/\s+/g, ' ');
    const n1 = normalize(name1);
    const n2 = normalize(name2);
    
    // Exact match
    if (n1 === n2) return 1;
    
    // Check if one name contains the other
    if (n1.includes(n2) || n2.includes(n1)) return 0.8;
    
    // Split names and check for partial matches
    const words1 = n1.split(' ');
    const words2 = n2.split(' ');
    
    let matchingWords = 0;
    const totalWords = Math.max(words1.length, words2.length);
    
    for (const word1 of words1) {
      for (const word2 of words2) {
        if (word1 === word2 && word1.length > 1) {
          matchingWords++;
          break;
        }
      }
    }
    
    return matchingWords / totalWords;
  }
  
  /**
   * Parse full name into first and last name components
   * @param {string} fullName - Full name to parse
   * @returns {Object} Object with firstName and lastName
   */
  parseFullName(fullName) {
    if (!fullName || typeof fullName !== 'string') {
      return { firstName: '', lastName: '' };
    }
    
    const nameParts = fullName.trim().split(/\s+/);
    
    if (nameParts.length === 1) {
      return { firstName: nameParts[0], lastName: '' };
    } else if (nameParts.length === 2) {
      return { firstName: nameParts[0], lastName: nameParts[1] };
    } else {
      // For names with more than 2 parts, first word is firstName, last word is lastName
      return { 
        firstName: nameParts[0], 
        lastName: nameParts[nameParts.length - 1] 
      };
    }
  }
  
  /**
   * Find players matching name and school
   * @private
   */
  async findNameSchoolMatches(firstName, lastName, schoolIRN) {
    try {
      // Search for exact first and last name with same school
      const exactMatches = await filterPlayers({
        firstName: firstName,
        lastName: lastName,
        highSchoolIRN: schoolIRN
      }, 10);
      
      return exactMatches || [];
    } catch (error) {
      console.error('Error finding name+school matches:', error);
      return [];
    }
  }
  
  /**
   * Find players matching name and phone
   * @private
   */
  async findNamePhoneMatches(firstName, lastName, normalizedPhone) {
    try {
      // Note: This assumes the Player entity has a phoneNumber field
      // You may need to adjust based on your actual schema
      const phoneMatches = await filterPlayers({
        firstName: firstName,
        lastName: lastName,
        phoneNumber: normalizedPhone
      }, 10);
      
      return phoneMatches || [];
    } catch (error) {
      console.error('Error finding name+phone matches:', error);
      return [];
    }
  }
  
  /**
   * Find players with partial name matches
   * @private
   */
  async findPartialNameMatches(firstName, lastName) {
    try {
      const matches = [];

      // Search by first name only
      if (firstName) {
        const firstNameMatches = await filterPlayers({ firstName: firstName }, 20);
        matches.push(...(firstNameMatches || []));
      }

      // Search by last name only
      if (lastName) {
        const lastNameMatches = await filterPlayers({ lastName: lastName }, 20);
        matches.push(...(lastNameMatches || []));
      }

      return matches;
    } catch (error) {
      console.error('Error finding partial name matches:', error);
      return [];
    }
  }

  /**
   * Find players matching email address
   * @private
   */
  async findEmailMatches(normalizedEmail) {
    try {
      if (!normalizedEmail) {
        return [];
      }

      // Search for exact email matches
      const emailMatches = await filterPlayers({
        emailAddress: normalizedEmail
      }, 10);

      return emailMatches || [];
    } catch (error) {
      console.error('Error finding email matches:', error);
      return [];
    }
  }
  
  /**
   * Remove duplicate matches based on player ID
   * @private
   */
  removeDuplicateMatches(matches) {
    const seen = new Set();
    return matches.filter(match => {
      if (seen.has(match.id)) {
        return false;
      }
      seen.add(match.id);
      return true;
    });
  }
  
  /**
   * Get player by ID
   * @private
   */
  async getPlayerById(playerId) {
    try {
      const players = await filterPlayers({ id: playerId }, 1);
      return players && players.length > 0 ? players[0] : null;
    } catch (error) {
      console.error('Error getting player by ID:', error);
      return null;
    }
  }
  
  /**
   * Log audit action for tracking
   * @private
   */
  async logAuditAction(actionData) {
    try {
      // This would integrate with your audit logging system
      // For now, just console.log - you can implement proper logging later
      console.log('Audit Log:', {
        timestamp: new Date().toISOString(),
        ...actionData
      });
      
      // TODO: Implement actual audit logging to database
      // await AuditLog.create({
      //   timestamp: new Date().toISOString(),
      //   ...actionData
      // });
      
    } catch (error) {
      console.error('Error logging audit action:', error);
      // Don't throw error for logging failures
    }
  }
}

// Export singleton instance
export const playerMatchingService = new PlayerMatchingService();