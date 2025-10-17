import { filter as filterParentAssignments } from '../api/entities/ParentPlayerAssignment';

/**
 * Determines the effective user role based on user attributes and entity relationships
 * @param {Object} user - User object from authentication context
 * @returns {Promise<string>} - Effective role: 'admin', 'executive', 'player', 'parent', 'coach', 'user'
 */
export async function getEffectiveUserRole(user) {
  if (!user) return null;
  
  // Built-in roles take precedence
  if (user.role === 'admin') return 'admin';
  if (user.role === 'executive') return 'executive';
  
  // Check for player role
  if (user.playerId) return 'player';
  
  // Check for coach role
  if (user.coachId) return 'coach';
  
  // Check for parent role via ParentPlayerAssignment
  try {
    const parentAssignments = await filterParentAssignments({ 
      parentEmail: user.email,
      isActive: true 
    });
    if (parentAssignments && parentAssignments.length > 0) {
      return 'parent';
    }
  } catch (error) {
    console.error('Error checking parent assignments:', error);
  }
  
  // Default to user role or 'user'
  return user.role || 'user';
}

/**
 * Checks if user has access to admin features
 * @param {string} role - User's effective role
 * @returns {boolean}
 */
export function hasAdminAccess(role) {
  return ['admin', 'executive'].includes(role);
}

/**
 * Checks if user should be redirected to Player Portal
 * @param {string} role - User's effective role
 * @returns {boolean}
 */
export function shouldRedirectToPlayerPortal(role) {
  return ['player', 'parent'].includes(role);
}

/**
 * Gets allowed pages for a user role
 * @param {string} role - User's effective role
 * @returns {Array<string>} - Array of allowed page names
 */
export function getAllowedPages(role) {
  const pagesByRole = {
    admin: ['Dashboard', 'Roster', 'Recruiting', 'PlayerProfile', 'UploadPlayers', 'EditPlayer', 'PlayerChat', 'PlayerList', 'DuplicateCleanup', 'AddPlayer', 'UploadSchools', 'SchoolManagement', 'GenerateInviteCodes', 'ContactManagement', 'FullPlayerProfile', 'TournamentManagement', 'UploadPlayerImages', 'SchoolDataCleanup', 'RecruitingGuide', 'TeamManagement', 'CoachManagement', 'InviteUser', 'UserManagement', 'Payments', 'FeeManagement', 'BulkTeamAssignment', 'CoachRecruiting', 'TeamRoster', 'DocumentManagement', 'PendingChanges'],
    executive: ['Dashboard', 'Roster', 'Recruiting', 'PlayerProfile', 'UploadPlayers', 'EditPlayer', 'PlayerChat', 'PlayerList', 'DuplicateCleanup', 'AddPlayer', 'UploadSchools', 'SchoolManagement', 'GenerateInviteCodes', 'ContactManagement', 'FullPlayerProfile', 'TournamentManagement', 'UploadPlayerImages', 'SchoolDataCleanup', 'RecruitingGuide', 'TeamManagement', 'CoachManagement', 'InviteUser', 'UserManagement', 'Payments', 'FeeManagement', 'BulkTeamAssignment', 'CoachRecruiting', 'TeamRoster'],
    coach: ['CoachRecruiting', 'TeamRoster', 'PlayerProfile', 'FullPlayerProfile'],
    user: ['Dashboard', 'Roster', 'PlayerProfile'],
    player: ['PlayerPortal'],
    parent: ['PlayerPortal']
  };
  
  return pagesByRole[role] || [];
}