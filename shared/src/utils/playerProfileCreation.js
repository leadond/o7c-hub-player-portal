import { filter as filterPlayers, create as createPlayer } from '../api/entities/Player';

/**
 * Creates a basic player profile for a newly approved user
 * @param {Object} userData - The user data from AppUser
 * @returns {Promise<Object|null>} - The created player profile or null if not created
 */
export async function createPlayerProfileForUser(userData) {
  if (!userData || userData.role !== 'Player') {
    return null;
  }

  try {
    // Check if a player profile already exists for this email
    const existingPlayers = await filterPlayers({ emailAddress: userData.email }, 1);
    
    if (existingPlayers && existingPlayers.length > 0) {
      console.log(`Player profile already exists for email: ${userData.email}`);
      return existingPlayers[0];
    }

    // Extract name from email or use default values
    const emailParts = userData.email.split('@')[0];
    const nameParts = emailParts.split(/[._-]/);
    
    // Try to extract first and last name from email
    let firstName = 'New';
    let lastName = 'Player';
    
    if (nameParts.length >= 2) {
      firstName = capitalizeFirstLetter(nameParts[0]);
      lastName = capitalizeFirstLetter(nameParts[nameParts.length - 1]);
    } else if (nameParts.length === 1) {
      firstName = capitalizeFirstLetter(nameParts[0]);
      lastName = 'Player';
    }

    // Create basic player profile
    const playerData = {
      firstName: firstName,
      lastName: lastName,
      emailAddress: userData.email,
      position: '', // Will be filled by player
      class: null, // Will be filled by player
      stars: 0, // Unrated initially
      height: '',
      weight: null,
      phoneNumber: '',
      homeAddress: '',
      homeCity: '',
      homeState: '',
      homeZip: '',
      highSchool: '',
      highSchoolIRN: '',
      offers: 0,
      commitment: '',
      notes: `Profile created automatically on ${new Date().toLocaleDateString()} for approved user.`,
      // Set profile as incomplete so player knows to fill it out
      profileComplete: false,
      createdFromUserApproval: true,
      createdAt: new Date().toISOString()
    };

    console.log(`Creating player profile for approved user: ${userData.email}`);
    const newPlayer = await createPlayer(playerData);
    
    console.log(`Successfully created player profile with ID: ${newPlayer.id}`);
    return newPlayer;

  } catch (error) {
    console.error('Error creating player profile for approved user:', error);
    throw error;
  }
}

/**
 * Capitalizes the first letter of a string
 * @param {string} str - The string to capitalize
 * @returns {string} - The capitalized string
 */
function capitalizeFirstLetter(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Checks if a user needs a player profile created
 * @param {Object} userData - The user data
 * @returns {boolean} - True if a player profile should be created
 */
export function shouldCreatePlayerProfile(userData) {
  return userData && 
         userData.role === 'Player' && 
         userData.status === 'active' && 
         userData.email;
}