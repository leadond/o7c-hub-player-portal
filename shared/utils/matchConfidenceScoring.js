/**
 * Match Confidence Scoring System
 * Provides utilities for calculating and ranking player match confidence scores
 */

/**
 * Match type definitions with base confidence scores
 */
export const MATCH_TYPES = {
  EMAIL_MATCH: {
    type: 'email_match',
    baseScore: 98,
    description: 'Exact email address match'
  },
  EXACT_NAME_SCHOOL: {
    type: 'name_school',
    baseScore: 95,
    description: 'Exact name match with same school'
  },
  EXACT_NAME_PHONE: {
    type: 'name_phone',
    baseScore: 90,
    description: 'Exact name match with same phone number'
  },
  PARTIAL_NAME_SCHOOL: {
    type: 'partial_name_school',
    baseScore: 75,
    description: 'Partial name match with same school'
  },
  PARTIAL_NAME_PHONE: {
    type: 'partial_name_phone',
    baseScore: 70,
    description: 'Partial name match with same phone number'
  },
  NAME_SIMILARITY: {
    type: 'name_partial',
    baseScore: 50,
    description: 'Similar name variations'
  },
  PHONE_ONLY: {
    type: 'phone_only',
    baseScore: 30,
    description: 'Phone number match only'
  }
};

/**
 * Confidence level thresholds
 */
export const CONFIDENCE_LEVELS = {
  HIGH: { min: 80, max: 100, label: 'High', color: 'green' },
  MEDIUM: { min: 60, max: 79, label: 'Medium', color: 'yellow' },
  LOW: { min: 30, max: 59, label: 'Low', color: 'orange' },
  VERY_LOW: { min: 0, max: 29, label: 'Very Low', color: 'red' }
};

/**
 * Calculate confidence score for a match based on multiple factors
 * @param {Object} match - Match object with player data
 * @param {Object} searchCriteria - Original search criteria
 * @param {string} matchType - Type of match found
 * @returns {Object} Enhanced match with confidence score and details
 */
export function calculateMatchConfidence(match, searchCriteria, matchType) {
  let confidenceScore = 0;
  const matchingFactors = [];
  const penalties = [];
  
  // Get base score for match type
  const baseScore = getBaseScoreForMatchType(matchType);
  confidenceScore = baseScore;
  
  // Name matching analysis
  const nameScore = analyzeNameMatch(match, searchCriteria);
  confidenceScore = Math.max(confidenceScore, nameScore.score);
  matchingFactors.push(...nameScore.factors);
  penalties.push(...nameScore.penalties);
  
  // School matching analysis
  const schoolScore = analyzeSchoolMatch(match, searchCriteria);
  if (schoolScore.matched) {
    confidenceScore += schoolScore.bonus;
    matchingFactors.push(...schoolScore.factors);
  } else if (schoolScore.penalty > 0) {
    confidenceScore -= schoolScore.penalty;
    penalties.push(...schoolScore.penalties);
  }
  
  // Phone matching analysis
  const phoneScore = analyzePhoneMatch(match, searchCriteria);
  if (phoneScore.matched) {
    confidenceScore += phoneScore.bonus;
    matchingFactors.push(...phoneScore.factors);
  } else if (phoneScore.penalty > 0) {
    confidenceScore -= phoneScore.penalty;
    penalties.push(...phoneScore.penalties);
  }
  
  // Apply additional factors
  const additionalScore = analyzeAdditionalFactors(match, searchCriteria);
  confidenceScore += additionalScore.adjustment;
  matchingFactors.push(...additionalScore.factors);
  penalties.push(...additionalScore.penalties);
  
  // Ensure score stays within bounds
  confidenceScore = Math.max(0, Math.min(100, Math.round(confidenceScore)));
  
  return {
    ...match,
    confidenceScore,
    confidenceLevel: getConfidenceLevel(confidenceScore),
    matchingFactors,
    penalties,
    matchType,
    matchAnalysis: {
      nameMatch: nameScore,
      schoolMatch: schoolScore,
      phoneMatch: phoneScore,
      additionalFactors: additionalScore
    }
  };
}

/**
 * Get base confidence score for match type
 * @private
 */
function getBaseScoreForMatchType(matchType) {
  const type = Object.values(MATCH_TYPES).find(t => t.type === matchType);
  return type ? type.baseScore : 50;
}

/**
 * Analyze name matching quality
 * @private
 */
function analyzeNameMatch(match, searchCriteria) {
  const factors = [];
  const penalties = [];
  let score = 0;
  
  const searchFirst = (searchCriteria.firstName || '').toLowerCase().trim();
  const searchLast = (searchCriteria.lastName || '').toLowerCase().trim();
  const searchFull = (searchCriteria.fullName || '').toLowerCase().trim();
  
  const matchFirst = (match.firstName || '').toLowerCase().trim();
  const matchLast = (match.lastName || '').toLowerCase().trim();
  const matchFull = `${matchFirst} ${matchLast}`.trim();
  
  // Exact first and last name match
  if (searchFirst && searchLast && searchFirst === matchFirst && searchLast === matchLast) {
    score = 95;
    factors.push('Exact first and last name match');
  }
  // Exact full name match
  else if (searchFull && searchFull === matchFull) {
    score = 95;
    factors.push('Exact full name match');
  }
  // First name exact, last name partial
  else if (searchFirst === matchFirst && searchLast && matchLast.includes(searchLast)) {
    score = 85;
    factors.push('Exact first name, partial last name match');
  }
  // Last name exact, first name partial
  else if (searchLast === matchLast && searchFirst && matchFirst.includes(searchFirst)) {
    score = 85;
    factors.push('Exact last name, partial first name match');
  }
  // Both names partial match
  else if (searchFirst && searchLast && 
           matchFirst.includes(searchFirst) && matchLast.includes(searchLast)) {
    score = 70;
    factors.push('Partial first and last name match');
  }
  // Only first name matches
  else if (searchFirst === matchFirst) {
    score = 60;
    factors.push('First name match only');
    if (!searchLast || !matchLast) {
      penalties.push('Missing last name information');
    }
  }
  // Only last name matches
  else if (searchLast === matchLast) {
    score = 60;
    factors.push('Last name match only');
    if (!searchFirst || !matchFirst) {
      penalties.push('Missing first name information');
    }
  }
  // Fuzzy name similarity
  else {
    const similarity = calculateStringSimilarity(searchFull || `${searchFirst} ${searchLast}`.trim(), matchFull);
    score = Math.round(similarity * 50); // Scale to 0-50 for fuzzy matches
    if (score > 20) {
      factors.push(`Name similarity: ${Math.round(similarity * 100)}%`);
    } else {
      penalties.push('Low name similarity');
    }
  }
  
  return { score, factors, penalties };
}

/**
 * Analyze school matching
 * @private
 */
function analyzeSchoolMatch(match, searchCriteria) {
  const factors = [];
  const penalties = [];
  let matched = false;
  let bonus = 0;
  let penalty = 0;
  
  const searchSchoolIRN = searchCriteria.schoolIRN;
  const matchSchoolIRN = match.highSchoolIRN;
  
  if (searchSchoolIRN && matchSchoolIRN) {
    if (searchSchoolIRN === matchSchoolIRN) {
      matched = true;
      bonus = 10;
      factors.push('Same school (IRN match)');
    } else {
      penalty = 5;
      penalties.push('Different schools');
    }
  } else if (searchSchoolIRN && !matchSchoolIRN) {
    penalties.push('Player missing school information');
  } else if (!searchSchoolIRN && matchSchoolIRN) {
    penalties.push('Search missing school information');
  }
  
  return { matched, bonus, penalty, factors, penalties };
}

/**
 * Analyze phone number matching
 * @private
 */
function analyzePhoneMatch(match, searchCriteria) {
  const factors = [];
  const penalties = [];
  let matched = false;
  let bonus = 0;
  let penalty = 0;
  
  const searchPhone = normalizePhoneForComparison(searchCriteria.phoneNumber);
  const matchPhone = normalizePhoneForComparison(match.phoneNumber);
  
  if (searchPhone && matchPhone) {
    if (searchPhone === matchPhone) {
      matched = true;
      bonus = 15;
      factors.push('Phone number match');
    } else {
      penalty = 3;
      penalties.push('Different phone numbers');
    }
  } else if (searchPhone && !matchPhone) {
    penalties.push('Player missing phone number');
  } else if (!searchPhone && matchPhone) {
    penalties.push('Search missing phone number');
  }
  
  return { matched, bonus, penalty, factors, penalties };
}

/**
 * Analyze additional matching factors
 * @private
 */
function analyzeAdditionalFactors(match, searchCriteria) {
  const factors = [];
  const penalties = [];
  let adjustment = 0;
  
  // Email similarity (if available)
  if (searchCriteria.email && match.emailAddress) {
    console.log('analyzeAdditionalFactors: Comparing emails - search:', searchCriteria.email.toLowerCase(), 'match:', match.emailAddress.toLowerCase());
    if (searchCriteria.email.toLowerCase() === match.emailAddress.toLowerCase()) {
      adjustment += 20;
      factors.push('Email address match');
      console.log('analyzeAdditionalFactors: Email match found, adding +20 bonus');
    } else {
      console.log('analyzeAdditionalFactors: Email mismatch');
    }
  } else {
    console.log('analyzeAdditionalFactors: Missing email data - search:', !!searchCriteria.email, 'match:', !!match.emailAddress);
  }
  
  // Recent activity bonus
  if (match.updatedAt) {
    const daysSinceUpdate = (Date.now() - new Date(match.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate < 30) {
      adjustment += 2;
      factors.push('Recently updated profile');
    } else if (daysSinceUpdate > 365) {
      adjustment -= 2;
      penalties.push('Profile not updated recently');
    }
  }
  
  // Profile completeness bonus
  let completenessScore = 0;
  const requiredFields = ['firstName', 'lastName', 'emailAddress', 'phoneNumber', 'highSchoolIRN'];
  const filledFields = requiredFields.filter(field => match[field] && match[field].toString().trim());
  completenessScore = (filledFields.length / requiredFields.length) * 5;
  
  if (completenessScore >= 4) {
    adjustment += Math.round(completenessScore);
    factors.push('Complete profile information');
  } else if (completenessScore < 2) {
    adjustment -= 2;
    penalties.push('Incomplete profile information');
  }
  
  return { adjustment, factors, penalties };
}

/**
 * Get confidence level based on score
 * @param {number} score - Confidence score (0-100)
 * @returns {Object} Confidence level object
 */
export function getConfidenceLevel(score) {
  for (const [key, level] of Object.entries(CONFIDENCE_LEVELS)) {
    if (score >= level.min && score <= level.max) {
      return { ...level, key };
    }
  }
  return CONFIDENCE_LEVELS.VERY_LOW;
}

/**
 * Sort matches by confidence score and additional criteria
 * @param {Array} matches - Array of matches with confidence scores
 * @returns {Array} Sorted matches
 */
export function sortMatchesByConfidence(matches) {
  return matches.sort((a, b) => {
    // Primary sort: confidence score (descending)
    if (b.confidenceScore !== a.confidenceScore) {
      return b.confidenceScore - a.confidenceScore;
    }
    
    // Secondary sort: match type priority
    const typeOrder = {
      'email_match': 0,
      'name_school': 1,
      'name_phone': 2,
      'partial_name_school': 3,
      'partial_name_phone': 4,
      'name_partial': 5,
      'phone_only': 6
    };
    
    const aTypeOrder = typeOrder[a.matchType] || 99;
    const bTypeOrder = typeOrder[b.matchType] || 99;
    
    if (aTypeOrder !== bTypeOrder) {
      return aTypeOrder - bTypeOrder;
    }
    
    // Tertiary sort: profile completeness
    const aCompleteness = calculateProfileCompleteness(a);
    const bCompleteness = calculateProfileCompleteness(b);
    
    return bCompleteness - aCompleteness;
  });
}

/**
 * Calculate string similarity using simple algorithm
 * @private
 */
function calculateStringSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1;
  
  const editDistance = calculateEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Calculate edit distance between two strings
 * @private
 */
function calculateEditDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Normalize phone number for comparison
 * @private
 */
function normalizePhoneForComparison(phone) {
  if (!phone) return '';
  return phone.replace(/\D/g, '').replace(/^1/, ''); // Remove non-digits and leading 1
}

/**
 * Calculate profile completeness score
 * @private
 */
function calculateProfileCompleteness(player) {
  const fields = ['firstName', 'lastName', 'emailAddress', 'phoneNumber', 'highSchoolIRN', 'position', 'class'];
  const filledFields = fields.filter(field => player[field] && player[field].toString().trim());
  return filledFields.length / fields.length;
}