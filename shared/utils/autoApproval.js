import { filter as filterPlayers } from '../api/entities/Player';
import { filter as filterParents } from '../api/entities/ParentPlayerAssignment';
import { filter as filterCoaches } from '../api/entities/Coach';

/**
 * Checks if a given email should be auto-approved by matching against
 * Player emailAddress field specifically for player access.
 *
 * @param {string} email - The email address to check
 * @returns {Promise<boolean>} - True if the email matches a player record and should be auto-approved
 */
export async function checkAutoApproval(email) {
  if (!email || typeof email !== 'string') {
    console.log('checkAutoApproval: Invalid email input:', email);
    return false;
  }

  const normalizedEmail = email.toLowerCase().trim();
  console.log('checkAutoApproval: Checking email:', normalizedEmail);

  try {
    // Check Players only - auto-approve if email is in player database
    const playerMatches = await filterPlayers({ emailAddress: normalizedEmail }, 1);
    console.log('checkAutoApproval: Player matches found:', playerMatches ? playerMatches.length : 0);
    if (playerMatches && playerMatches.length > 0) {
      console.log('checkAutoApproval: Auto-approving for player:', playerMatches[0].id);
      return true;
    }

    console.log('checkAutoApproval: No matches found, not auto-approving');
    return false;
  } catch (error) {
    console.error('Error checking auto-approval:', error);
    // In case of error, default to not auto-approving
    return false;
  }
}

/**
 * Checks if a given email exists in any of the system databases
 * (Players, Parents, or Coaches) for general verification purposes.
 *
 * @param {string} email - The email address to check
 * @returns {Promise<{found: boolean, type: string|null}>} - Object indicating if found and what type
 */
export async function checkEmailInDatabase(email) {
  if (!email || typeof email !== 'string') {
    return { found: false, type: null };
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Check Players
    const playerMatches = await filterPlayers({ emailAddress: normalizedEmail }, 1);
    if (playerMatches && playerMatches.length > 0) {
      return { found: true, type: 'player' };
    }

    // Check Parent emails
    const parentMatches = await filterParents({ parentEmail: normalizedEmail }, 1);
    if (parentMatches && parentMatches.length > 0) {
      return { found: true, type: 'parent' };
    }

    // Check Coaches
    const coachMatches = await filterCoaches({ email: normalizedEmail }, 1);
    if (coachMatches && coachMatches.length > 0) {
      return { found: true, type: 'coach' };
    }

    return { found: false, type: null };
  } catch (error) {
    console.error('Error checking email in database:', error);
    return { found: false, type: null };
  }
}